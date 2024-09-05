// Main application logic
const app = {
    init() {
        this.bindEvents();
        this.loadSection('exercises');
    },

    bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.loadSection(section);
            });
        });
    },

    loadSection(section) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '';

        switch (section) {
            case 'exercises':
                this.loadExercises();
                break;
            case 'add-exercise':
                this.loadAddExercise();
                break;
            case 'progress':
                this.loadProgress();
                break;
            case 'data':
                this.loadData();
                break;
        }
    },

    loadExercises() {
        const mainContent = document.getElementById('main-content');
        const categories = this.getCategories();
        
        categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.innerHTML = `
                <h2 class="mt-4 mb-3">${category}</h2>
                <div class="row" id="${category.replace(/\s+/g, '-').toLowerCase()}">
                </div>
            `;
            mainContent.appendChild(categoryDiv);

            const exercises = this.getExercisesByCategory(category);
            const categoryContainer = document.getElementById(category.replace(/\s+/g, '-').toLowerCase());

            exercises.forEach(exercise => {
                const card = document.createElement('div');
                card.className = 'col-md-4 mb-3';
                const lastRecord = this.getLastRecord(exercise);
                card.innerHTML = `
                    <div class="card exercise-card" data-exercise="${exercise.name}">
                        <div class="card-body">
                            <h5 class="card-title">${exercise.name}</h5>
                            <p class="card-text">
                                Últim registre:<br>
                                Sèries: ${lastRecord.sets.length}<br>
                                ${this.formatSets(lastRecord.sets)}<br>
                                Volum: ${this.calculateVolume(lastRecord)} kg
                            </p>
                        </div>
                    </div>
                `;
                categoryContainer.appendChild(card);

                card.addEventListener('click', () => this.showExerciseModal(exercise));
            });
        });
    },

    formatSets(sets) {
        return sets.map((set, index) => `Sèrie ${index + 1}: ${set.weight}kg x ${set.reps}`).join('<br>');
    },

    loadAddExercise() {
        const mainContent = document.getElementById('main-content');
        const categories = this.getCategories();

        mainContent.innerHTML = `
            <h2>Introdueix un nou exercici</h2>
            <form id="add-exercise-form">
                <div class="mb-3">
                    <label for="exercise-name" class="form-label">Nom de l'exercici</label>
                    <input type="text" class="form-control" id="exercise-name" required>
                </div>
                <div class="mb-3">
                    <label for="exercise-category" class="form-label">Categoria</label>
                    <select class="form-select" id="exercise-category" required>
                        <option value="">Selecciona una categoria</option>
                        ${categories.map(category => `<option value="${category}">${category}</option>`).join('')}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="new-category" class="form-label">O crea una nova categoria</label>
                    <input type="text" class="form-control" id="new-category">
                </div>
                <button type="submit" class="btn btn-primary">Afegir exercici</button>
            </form>
        `;

        document.getElementById('add-exercise-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('exercise-name').value;
            let category = document.getElementById('exercise-category').value;
            const newCategory = document.getElementById('new-category').value;

            if (newCategory) {
                category = newCategory;
                this.addCategory(category);
            }

            this.addExercise(name, category);
            alert('Exercici afegit amb èxit!');
            this.loadSection('exercises');
        });
    },

    loadProgress() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <h2>Progrés</h2>
            <div class="mb-3">
                <label for="progress-select" class="form-label">Selecciona categoria o exercici</label>
                <select class="form-select" id="progress-select">
                    <option value="">Selecciona una opció</option>
                </select>
            </div>
            <canvas id="progress-chart" class="progress-chart"></canvas>
        `;

        const progressSelect = document.getElementById('progress-select');
        const categories = this.getCategories();
        const exercises = this.getAllExercises();

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = `category:${category}`;
            option.textContent = `Categoria: ${category}`;
            progressSelect.appendChild(option);
        });

        exercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = `exercise:${exercise.name}`;
            option.textContent = `Exercici: ${exercise.name}`;
            progressSelect.appendChild(option);
        });

        progressSelect.addEventListener('change', (e) => {
            const [type, name] = e.target.value.split(':');
            if (type === 'category') {
                this.showCategoryProgress(name);
            } else if (type === 'exercise') {
                this.showExerciseProgress(name);
            }
        });
    },

    loadData() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <h2>Dades</h2>
            <div class="mb-3">
                <button id="download-data" class="btn btn-primary">Descarregar dades (JSON)</button>
            </div>
            <div class="mb-3">
                <label for="upload-data" class="form-label">Carregar dades</label>
                <input type="file" class="form-control" id="upload-data" accept=".json">
            </div>
        `;

        document.getElementById('download-data').addEventListener('click', () => this.downloadData());
        document.getElementById('upload-data').addEventListener('change', (e) => this.uploadData(e));
    },

    showExerciseModal(exercise) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'exerciseModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'exerciseModalLabel');
        modal.setAttribute('aria-hidden', 'true');

        const lastBestRecord = this.getLastBestRecord(exercise);

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exerciseModalLabel">${exercise.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <h6>Últim millor registre:</h6>
                        <p>
                            Sèries: ${lastBestRecord.sets.length}<br>
                            ${this.formatSets(lastBestRecord.sets)}<br>
                            Volum: ${this.calculateVolume(lastBestRecord)} kg
                        </p>
                        <form id="add-set-form">
                            <div id="sets-container">
                                ${this.generateSetInputs(lastBestRecord.sets)}
                            </div>
                            <button type="button" class="btn btn-secondary mb-3" id="add-set-btn">Afegir sèrie</button>
                            <div class="mb-3">
                                <label for="date" class="form-label">Data</label>
                                <input type="date" class="form-control" id="date" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Afegir registre</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();

        document.getElementById('date').valueAsDate = new Date();

        const addSetBtn = document.getElementById('add-set-btn');
        const setsContainer = document.getElementById('sets-container');
        let setCount = lastBestRecord.sets.length;

        addSetBtn.addEventListener('click', () => {
            setCount++;
            const newSetInput = this.createSetInput(setCount);
            setsContainer.appendChild(newSetInput);

            newSetInput.querySelector('.remove-set-btn').addEventListener('click', () => {
                newSetInput.remove();
                this.updateSetNumbers();
            });
        });

        document.getElementById('add-set-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const sets = Array.from(document.querySelectorAll('.set-input')).map(input => ({
                weight: parseFloat(input.querySelector('.weight-input').value),
                reps: parseInt(input.querySelector('.reps-input').value)
            }));
            const date = document.getElementById('date').value;

            this.addSet(exercise.name, sets, date);
            modalInstance.hide();
            this.loadSection('exercises');
        });

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });

        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-set-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.set-input').remove();
                this.updateSetNumbers();
            });
        });
    },

    generateSetInputs(sets) {
        return sets.map((set, index) => this.createSetInput(index + 1, set.weight, set.reps).outerHTML).join('');
    },

    createSetInput(setNumber, weight = '', reps = '') {
        const setInput = document.createElement('div');
        setInput.className = 'mb-3 set-input';
        setInput.innerHTML = `
            <h6>Sèrie ${setNumber} ${setNumber > 1 ? '<button type="button" class="btn btn-danger btn-sm remove-set-btn">Eliminar</button>' : ''}</h6>
            <div class="row">
                <div class="col">
                    <label for="weight-${setNumber}" class="form-label">Pes (kg)</label>
                    <input type="number" class="form-control weight-input" id="weight-${setNumber}" value="${weight}" required>
                </div>
                <div class="col">
                    <label for="reps-${setNumber}" class="form-label">Repeticions</label>
                    <input type="number" class="form-control reps-input" id="reps-${setNumber}" value="${reps}" required>
                </div>
            </div>
        `;
        return setInput;
    },

    updateSetNumbers() {
        const setInputs = document.querySelectorAll('.set-input');
        setInputs.forEach((input, index) => {
            const setNumber = index + 1;
            input.querySelector('h6').innerText = `Sèrie ${setNumber}`;
            if (setNumber > 1) {
                input.querySelector('h6').innerHTML += ' <button type="button" class="btn btn-danger btn-sm remove-set-btn">Eliminar</button>';
            }
            input.querySelector('.weight-input').id = `weight-${setNumber}`;
            input.querySelector('.reps-input').id = `reps-${setNumber}`;
        });
    },

    getCategories() {
        const categories = JSON.parse(localStorage.getItem('categories')) || ['Tronc superior', 'Tronc inferior'];
        return categories;
    },

    addCategory(category) {
        const categories = this.getCategories();
        if (!categories.includes(category)) {
            categories.push(category);
            localStorage.setItem('categories', JSON.stringify(categories));
        }
    },

    getExercisesByCategory(category) {
        const exercises = JSON.parse(localStorage.getItem('exercises')) || [];
        return exercises.filter(exercise => exercise.category === category);
    },

    getAllExercises() {
        return JSON.parse(localStorage.getItem('exercises')) || [];
    },

    addExercise(name, category) {
        const exercises = this.getAllExercises();
        exercises.push({
            name,
            category,
            records: []
        });
        localStorage.setItem('exercises', JSON.stringify(exercises));
    },

    addSet(exerciseName, sets, date) {
        const exercises = this.getAllExercises();
        const exercise = exercises.find(ex => ex.name === exerciseName);
        
        if (exercise) {
            const newSet = { sets, date };
            exercise.records.push(newSet);
            localStorage.setItem('exercises', JSON.stringify(exercises));
        }
    },

    getLastRecord(exercise) {
        if (exercise.records.length === 0) {
            return { sets: [], date: '' };
        }
        return exercise.records[exercise.records.length - 1];
    },

    getLastBestRecord(exercise) {
        if (exercise.records.length === 0) {
            return { sets: [], date: '' };
        }
        return exercise.records.reduce((best, current) => {
            const bestVolume = this.calculateVolume(best);
            const currentVolume = this.calculateVolume(current);
            return currentVolume >= bestVolume ? current : best;
        });
    },

    calculateVolume(record) {
        return record.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
    },

    showCategoryProgress(category) {
        const exercises = this.getExercisesByCategory(category);
        const datasets = exercises.map(exercise => {
            const data = exercise.records.map(record => ({
                x: record.date,
                y: this.calculateVolume(record)
            }));

            return {
                label: exercise.name,
                data: data,
                borderColor: this.getRandomColor(),
                fill: false
            };
        });

        this.createChart(datasets, `Progrés de la categoria: ${category}`);
    },

    showExerciseProgress(exerciseName) {
        const exercise = this.getAllExercises().find(ex => ex.name === exerciseName);
        if (exercise) {
            const data = exercise.records.map(record => ({
                x: record.date,
                y: this.calculateVolume(record)
            }));

            const dataset = {
                label: exercise.name,
                data: data,
                borderColor: this.getRandomColor(),
                fill: false
            };

            this.createChart([dataset], `Progrés de l'exercici: ${exerciseName}`);
        }
    },

    createChart(datasets, title) {
        const ctx = document.getElementById('progress-chart').getContext('2d');
        if (window.progressChart instanceof Chart) {
            window.progressChart.destroy();
        }
        window.progressChart = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                plugins: {
                    title: { 
                        display: true, 
                        text: title 
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return new Date(context[0].parsed.x).toLocaleDateString('ca-ES', { year: 'numeric', month: 'long', day: 'numeric' });
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        type: 'time',
                        time: {
                            parser: 'yyyy-MM-dd',
                            unit: 'day',
                            displayFormats: {
                                day: 'dd/MM/yyyy'
                            }
                        },
                        title: { 
                            display: true, 
                            text: 'Data' 
                        }
                    },
                    y: { 
                        title: { 
                            display: true, 
                            text: 'Volum (kg)' 
                        }
                    }
                }
            }
        });
    },

    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },

    downloadData() {
        const data = {
            categories: this.getCategories(),
            exercises: this.getAllExercises()
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "gym_tracker_data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    },

    uploadData(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    localStorage.setItem('categories', JSON.stringify(data.categories));
                    localStorage.setItem('exercises', JSON.stringify(data.exercises));
                    alert('Dades carregades amb èxit!');
                    this.loadSection('exercises');
                } catch (error) {
                    alert('Error en carregar les dades. Assegura\'t que el fitxer té el format correcte.');
                }
            };
            reader.readAsText(file);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
