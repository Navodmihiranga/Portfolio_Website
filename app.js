const $ = (s) => document.querySelector(s);

let allProjects = [], activeFilter = 'all', pickedImage = '';

const esc = (value = '') => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));

const visual = (p) => p.image?.startsWith('data:') ? `custom-image" style="background-image:url('${p.image}')` : p.image || 'gradient-violet';

async function loadProjects() { 
    const res = await fetch('/api/projects'); 
    allProjects = await res.json(); 
    render(); renderManaged(); 
}

function render() { 
    const projects = activeFilter === 'all' ? allProjects : allProjects.filter(p => p.category === activeFilter); 
    $('#projects').innerHTML = projects.map(p => `<article class="project" data-id="${p.id}"><div class="project-visual ${visual(p)}"></div><div class="project-copy"><div><h3>${esc(p.title)}</h3><p>${esc(p.category)} / ${esc(p.stack)}</p></div><span class="year">${esc(p.year)}</span></div></article>`).join('') || '<p>No projects in this orbit yet.</p>'; 
    document.querySelectorAll('.project').forEach(el => el.onclick = () => openProject(allProjects.find(p => p.id == el.dataset.id))); 
}

function renderManaged() { 
    $('#project-list').innerHTML = allProjects.map(p => `<div class="managed-item"><span>${esc(p.title)}</span><button data-delete="${p.id}">Delete</button></div>`).join(''); document.querySelectorAll('[data-delete]').forEach(button => button.onclick = async () => { await fetch('/api/projects/' + button.dataset.delete, { method: 'DELETE' }); loadProjects(); });
}

function openProject(p) { 
    const bg = p.image?.startsWith('data:') ? `style="background-image:url('${p.image}')"` : ''; 
    $('#modal-content').innerHTML = `<div class="modal-visual ${p.image || 'gradient-violet'}" ${bg}></div><div class="modal-copy"><p class="modal-meta">${esc(p.category)} / ${esc(p.year)}</p><h2>${esc(p.title)}</h2><p>${esc(p.description)}</p><p class="modal-meta">${esc(p.stack)}</p></div>`; 
    $('#project-modal').showModal(); 
}

function closeProject() {
    document.body.classList.remove('studio-open');

    $('#project-form').reset();
    pickedImage = '';
    $('#dropzone strong').textContent = 'Upload a project visual';
    $('#form-status').textContent = '';
}

$('.studio-toggle').onclick = () => document.body.classList.add('studio-open'); $('.close').onclick = $('.scrim').onclick = () => document.body.classList.remove('studio-open'); 
$('.menu').onclick = () => document.body.classList.add('studio-open'); 
$('.modal-close').onclick = () => $('#project-modal').close();
$('#project-modal').onclick = closeProject;
$('.scrim').onclick = closeProject;

document.querySelectorAll('.filters button').forEach(button => button.onclick = () => { 
    document.querySelector('.filters .active').classList.remove('active'); 
    button.classList.add('active'); 
    activeFilter = button.dataset.filter; 
    render(); 
});

$('#image').onchange = (event) => { 
    const file = event.target.files[0]; if (!file) return; 
    if (file.size > 5 * 1024 * 1024) {
        $('#form-status').textContent = 'Choose an image under 5 MB.'; 
        return; 
    } 
    const reader = new FileReader(); 
    reader.onload = () => { 
        pickedImage = reader.result; $('#dropzone strong').textContent = file.name; 
        $('#form-status').textContent = 'Image ready to publish.'; 
    }; 
    reader.readAsDataURL(file); 
};

$('#project-form').onsubmit = async (event) => { 
    event.preventDefault(); 
    const button = $('.publish'), status = $('#form-status'); 
    button.disabled = true; 
    button.textContent = 'Publishing…'; 
    const data = new URLSearchParams(new FormData(event.target)); 
    data.set('image', pickedImage); 
    try { 
        const result = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: data }); 
        if (!result.ok) 
            throw new Error((await result.json()).error); 
        event.target.reset(); 
        pickedImage = ''; $('#dropzone strong').textContent = 'Upload a project visual'; 
        status.textContent = 'Published. Your new signal is live.'; loadProjects(); 
    } catch (error) { 
        status.textContent = error.message || 'Could not publish this project.'; 
    } finally { 
        button.disabled = false; 
        button.innerHTML = 'Publish project <span>↗</span>'; 
    } 
};
loadProjects();
