const state = {
    x: null,
    r: null,
    history: []
}
const STORAGE_KEY = 'lab1_history'

function validateForm() {
    if (state.x === null) {
        return { ok: false, error: 'Выберите X' };
    }
    if (state.r === null) {
        return { ok: false, error: "Выберите R" };
    }

    const yResult = parseY(document.querySelector("#y_input").value);
    if (!yResult.ok) {
        return yResult;
    }

    return { ok: true, value: { x: state.x, y: yResult.value, r: state.r } };
}

function parseY(rawValue) {
    const text = rawValue.trim();
    const decimalPattern = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/;
    if (!decimalPattern.test(text)) {
        return { ok: false, error: 'Y должен быть десятичным дробным числом' };
    }
    const value = Number(text.replace(',', '.'));

    if (value <= -5 || value >= 5) {
        return { ok: false, error: 'Y должен быть строго между -5 и 5.' };
    }

    return { ok: true, value: value };
}

function checkPointHit(x, y, r) {
    const inTriangle =
        x <= 0 &&
        y >= 0 &&
        y <= x + r;

    const inQuarterCircle =
        x >= 0 &&
        y >= 0 &&
        x * x + y * y <= r * r;

    const inRectangle =
        x >= -r / 2 &&
        x <= 0 &&
        y >= -r &&
        y <= 0;

    return inTriangle || inQuarterCircle || inRectangle;
}

function saveHistory(history) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function loadHistory() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Ошибка загрузки истории из local storage:', error);
        return [];
    }
}

function createTableCell(value) {
    const cell = document.createElement("td");
    cell.textContent = String(value);
    return cell;
}

function renderHistory() {
    const tableBody = document.querySelector("#result-body");
    tableBody.replaceChildren();
    state.history.forEach(record => {
        const row = document.createElement("tr");
        row.append(
            createTableCell(record.x),
            createTableCell(record.y),
            createTableCell(record.r),
            createTableCell(record.hit ? 'Попадание' : 'Промах'),
            createTableCell(new Date(record.checkedAt).toLocaleString('ru-RU'))
        )
        tableBody.append(row);
    });
}

function getGraphData() {
    const canvas = document.querySelector('#draw-area');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 40;
    const screenX = x => centerX + x * scale;
    const screenY = y => centerY - y * scale;

    return { canvas, ctx, centerX, centerY, scale, screenX, screenY };
}

function drawGraph(r) {
    const {
        canvas, ctx, centerX, centerY, scale, screenX, screenY
    } = getGraphData();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(207, 81, 213, 0.55)';
    ctx.strokeStyle = '#323d91';
    ctx.lineWidth = 2;

    // triangle
    ctx.beginPath();
    ctx.moveTo(screenX(-r), screenY(0));
    ctx.lineTo(screenX(0), screenY(0));
    ctx.lineTo(screenX(0), screenY(r));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // circle
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(screenX(r), centerY);
    ctx.arc(centerX, centerY, r * scale, 0, -Math.PI / 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // reactangle
    ctx.fillRect(
        screenX(-r / 2),
        screenY(0),
        r / 2 * scale,
        r * scale
    );
    ctx.strokeRect(
        screenX(-r / 2),
        screenY(0),
        r / 2 * scale,
        r * scale
    );

    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    ctx.lineWidth = 1;
    ctx.font = '14px Arial';

    // x,y
    ctx.beginPath();
    ctx.moveTo(15, centerY);
    ctx.lineTo(canvas.width - 15, centerY);
    ctx.moveTo(centerX, canvas.height - 15);
    ctx.lineTo(centerX, 15);
    ctx.stroke();

    // x arrow
    ctx.beginPath();
    ctx.moveTo(canvas.width - 15, centerY);
    ctx.lineTo(canvas.width - 25, centerY - 5);
    ctx.moveTo(canvas.width - 15, centerY);
    ctx.lineTo(canvas.width - 25, centerY + 5);
    ctx.stroke();

    // y arrow
    ctx.beginPath();
    ctx.moveTo(centerX, 15);
    ctx.lineTo(centerX - 5, 25);
    ctx.moveTo(centerX, 15);
    ctx.lineTo(centerX + 5, 25);
    ctx.stroke();

    ctx.fillText('X', canvas.width - 25, centerY - 10);
    ctx.fillText('Y', centerX + 10, 25);

    const values = [-r, -r / 2, r / 2, r];
    values.forEach(value => {
        const x = screenX(value);
        const y = screenY(value);
        const label = String(value);

        ctx.beginPath();
        ctx.moveTo(x, centerY - 5);
        ctx.lineTo(x, centerY + 5);
        ctx.moveTo(centerX - 5, y);
        ctx.lineTo(centerX + 5, y);
        ctx.stroke();

        ctx.fillText(label, x - 8, centerY + 20);
        ctx.fillText(label, centerX + 10, y + 5);
    });

    state.history.forEach(record => {
        drawPoint(record.x, record.y, record.hit);
    });
}
function drawPoint(x, y, hit) {
    const { ctx, screenX, screenY } = getGraphData();

    ctx.fillStyle = hit ? 'green' : 'red';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.arc(screenX(x), screenY(y), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

state.history = loadHistory();
renderHistory(state.history);
drawGraph(1);

const form = document.querySelector("#point-form");
form.addEventListener('submit', event => {
    event.preventDefault();

    const errorDiv = document.querySelector("#error-message");

    const validationResult = validateForm();
    if (!validationResult.ok) {
        errorDiv.textContent = validationResult.error;
        return;
    }
    errorDiv.textContent = '';

    const { x, y, r } = validationResult.value;
    const hit = checkPointHit(x, y, r);
    const result = {
        x, y, r, hit, checkedAt: Date.now()
    };

    state.history.push(result);
    saveHistory(state.history);
    renderHistory(state.history);
    drawGraph(r);
});

const clearHistoryButton = document.querySelector('#clear-history');
clearHistoryButton.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    state.history = [];
    renderHistory();
    drawGraph(state.r ?? 1);
});

const buttons = document.querySelectorAll(".choice-button");
buttons.forEach(button => {
    button.addEventListener('click', () => {
        const field = button.dataset.field;
        const value = Number(button.dataset.value);

        console.log(`field='${field}', value='${value}'`);

        state[field] = value;

        document.querySelectorAll(`[data-field="${field}"]`).forEach(candidate => {
            if (candidate === button) {
                candidate.classList.add('active');
            } else {
                candidate.classList.remove('active');
            }
        });

        if (field === 'r') {
            drawGraph(state.r);
        }
    })
}
);
