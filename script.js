const defaultSubjects=[
  {name:"Maths",marks:85,hours:4},
  {name:"Science",marks:70,hours:3},
  {name:"English",marks:78,hours:3},
  {name:"Social Studies",marks:62,hours:2},
  {name:"Computer",marks:90,hours:6}
];

let subjects=JSON.parse(localStorage.getItem("studysparkSubjects"))||defaultSubjects;
let tasks=JSON.parse(localStorage.getItem("studysparkTasks"))||[];

let marksChart,hoursChart;

const $=id=>document.getElementById(id);
const save=()=>localStorage.setItem("studysparkSubjects",JSON.stringify(subjects));

function average(){return subjects.length?Math.round(subjects.reduce((a,s)=>a+s.marks,0)/subjects.length):0}
function totalHours(){return subjects.reduce((a,s)=>a+Number(s.hours),0)}
function weak(){return subjects.filter(s=>s.marks<75).sort((a,b)=>a.marks-b.marks)}

function updateDashboard(){
  $("totalSubjects").textContent=subjects.length;
  $("averageMarks").textContent=average()+"%";
  $("totalHours").textContent=totalHours()+"h";
  $("focusCount").textContent=weak().length;
  const progress=Math.min(100,Math.max(0,average()));
  $("overallProgress").style.width=progress+"%";
  $("progressText").textContent=progress+"%";

  $("weakSubjects").innerHTML=weak().length
    ? weak().map(s=>`<div class="weak"><span>${s.name}</span><strong>${s.marks}%</strong></div>`).join("")
    : "<p class='muted'>Great! No subject is below 75%.</p>";

  const w=weak();
  $("recommendation").textContent=w.length
    ? `Spend more time on ${w[0].name}. Aim for 2–3 focused sessions this week and review mistakes after each session.`
    : "Your performance is balanced. Keep your current routine and use practice tests to maintain consistency.";

  renderCharts();
}

function renderCharts(){
  if(marksChart) marksChart.destroy();
  if(hoursChart) hoursChart.destroy();

  marksChart=new Chart($("marksChart"),{
    type:"bar",
    data:{labels:subjects.map(s=>s.name),datasets:[{label:"Marks %",data:subjects.map(s=>s.marks),borderWidth:1}]},
    options:{responsive:true,scales:{y:{beginAtZero:true,max:100}}}
  });

  hoursChart=new Chart($("hoursChart"),{
    type:"line",
    data:{labels:subjects.map(s=>s.name),datasets:[
      {label:"Study Hours",data:subjects.map(s=>s.hours),tension:.3},
      {label:"Marks",data:subjects.map(s=>s.marks),tension:.3}
    ]},
    options:{responsive:true,scales:{y:{beginAtZero:true}}}
  });
}

function renderSubjects(){
  $("subjectList").innerHTML=subjects.map((s,i)=>`
    <div class="subject-row">
      <strong>${escapeHtml(s.name)}</strong>
      <label>Marks <input type="number" min="0" max="100" value="${s.marks}" data-i="${i}" data-field="marks"></label>
      <label>Hours <input type="number" min="0" step=".5" value="${s.hours}" data-i="${i}" data-field="hours"></label>
      <button class="delete" data-delete="${i}">Delete</button>
    </div>`).join("");

  document.querySelectorAll("[data-field]").forEach(input=>{
    input.addEventListener("change",e=>{
      const i=Number(e.target.dataset.i),field=e.target.dataset.field;
      subjects[i][field]=Number(e.target.value);
      save();updateDashboard();renderSubjects();renderPlanner();renderRecommendations();
    });
  });

  document.querySelectorAll("[data-delete]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      subjects.splice(Number(btn.dataset.delete),1);
      save();renderSubjects();updateDashboard();renderPlanner();renderRecommendations();
    });
  });
}

function renderPlanner(){
  const w=weak();
  $("planList").innerHTML=w.length?w.map((s,i)=>`
    <div class="plan"><strong>Day ${i+1}: ${escapeHtml(s.name)}</strong><br>
    45 minutes focused study + 15 minutes practice questions. Target: improve from ${s.marks}%.</div>
  `).join(""):"<div class='plan'>No weak subjects found. Use this time for revision and practice tests.</div>";
}

function renderRecommendations(){
  const w=weak();
  const tips=[];
  if(w.length) tips.push(`Focus first on <strong>${escapeHtml(w[0].name)}</strong>, your lowest-scoring subject.`);
  if(totalHours()<15) tips.push("Try gradually increasing your weekly study time with short, consistent sessions.");
  if(average()>=80) tips.push("Your average is strong. Use mock tests to maintain your performance.");
  tips.push("After every study session, record what you completed so your progress stays measurable.");
  $("recommendationList").innerHTML=tips.map(t=>`<div class="tip">💡 ${t}</div>`).join("");
}

function renderTasks(){
  if(!tasks.length){
    tasks=subjects.slice(0,3).map(s=>({text:`Study ${s.name} for 45 minutes`,done:false}));
  }
  $("taskList").innerHTML=tasks.map((t,i)=>`
    <label class="task ${t.done?"done":""}">
      <input type="checkbox" data-task="${i}" ${t.done?"checked":""}>
      <span>${escapeHtml(t.text)}</span>
    </label>`).join("");
  document.querySelectorAll("[data-task]").forEach(cb=>cb.addEventListener("change",e=>{
    tasks[Number(e.target.dataset.task)].done=e.target.checked;
    localStorage.setItem("studysparkTasks",JSON.stringify(tasks));
    renderTasks();
  }));
}

function escapeHtml(text){
  return String(text).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s=>s.classList.remove("active-section"));
    btn.classList.add("active");
    $(btn.dataset.section).classList.add("active-section");
    if(btn.dataset.section==="progress")renderTasks();
  });
});

$("addSubjectBtn").addEventListener("click",()=>$("modal").classList.remove("hidden"));
$("closeModal").addEventListener("click",()=>$("modal").classList.add("hidden"));

$("subjectForm").addEventListener("submit",e=>{
  e.preventDefault();
  subjects.push({
    name:$("subjectName").value.trim(),
    marks:Number($("subjectMarks").value),
    hours:Number($("subjectHours").value)
  });
  save();e.target.reset();$("modal").classList.add("hidden");
  renderSubjects();updateDashboard();renderPlanner();renderRecommendations();
});

$("resetBtn").addEventListener("click",()=>{
  if(confirm("Reset StudySpark to the sample data?")){
    subjects=JSON.parse(JSON.stringify(defaultSubjects));
    tasks=[];
    save();localStorage.removeItem("studysparkTasks");
    renderSubjects();updateDashboard();renderPlanner();renderRecommendations();
  }
});

renderSubjects();
updateDashboard();
renderPlanner();
renderRecommendations();
