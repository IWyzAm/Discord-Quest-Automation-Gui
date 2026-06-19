// ═══════════════════════════════════════════════════════════════════════════════
// Discord Quest Automator — Enhanced
// ═══════════════════════════════════════════════════════════════════════════════

const AutomatorState = {
	isPaused: false,
	isRunning: false,
	activeQuestId: null,
	completedQuests: 0,
	totalQuests: 0,
	skipRequested: false,
	lastProgressTime: null,
	stuckWatchdogTimer: null,
	STUCK_TIMEOUT_MS: 90_000, // 90s without progress → stuck
};

// ─── UI Creation ──────────────────────────────────────────────────────────────

function createQuestUI() {
	const existing = document.getElementById('quest-automator-ui');
	if (existing) existing.remove();

	const container = document.createElement('div');
	container.id = 'quest-automator-ui';
	container.innerHTML = `
		<style>
			@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

			* { box-sizing: border-box; }

			#quest-automator-ui {
				position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				width: 780px;
				max-height: 88vh;
				background: var(--background-primary, #313338);
				border-radius: 12px;
				box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
				z-index: 99999;
				font-family: 'Inter', 'gg sans', 'Noto Sans', Arial, sans-serif;
				color: var(--text-normal, #dbdee1);
				overflow: hidden;
				display: flex;
				flex-direction: column;
			}

			#quest-automator-ui.minimized {
				width: 320px;
				height: 56px;
				max-height: 56px;
			}

			#quest-automator-ui.minimized .quest-body { display: none; }

			/* ── Header ── */
			.qa-header {
				background: var(--background-secondary, #2b2d31);
				padding: 0 16px;
				height: 56px;
				border-bottom: 1px solid rgba(255,255,255,0.06);
				display: flex;
				align-items: center;
				justify-content: space-between;
				cursor: move;
				user-select: none;
				flex-shrink: 0;
			}

			.qa-header-left {
				display: flex;
				align-items: center;
				gap: 10px;
			}

			.qa-logo {
				width: 28px;
				height: 28px;
				background: linear-gradient(135deg, #5865f2 0%, #7c84f5 100%);
				border-radius: 8px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 14px;
				flex-shrink: 0;
			}

			.qa-title {
				font-size: 15px;
				font-weight: 700;
				color: var(--header-primary, #f2f3f5);
				letter-spacing: -0.2px;
			}

			.qa-badge {
				background: rgba(88,101,242,0.18);
				color: #8791f7;
				border: 1px solid rgba(88,101,242,0.3);
				padding: 2px 7px;
				border-radius: 6px;
				font-size: 10px;
				font-weight: 700;
				letter-spacing: 0.5px;
				text-transform: uppercase;
			}

			.qa-header-controls {
				display: flex;
				align-items: center;
				gap: 4px;
			}

			.hdr-btn {
				background: transparent;
				border: none;
				color: var(--interactive-normal, #949ba4);
				width: 30px;
				height: 30px;
				border-radius: 6px;
				cursor: pointer;
				font-size: 15px;
				display: flex;
				align-items: center;
				justify-content: center;
				transition: background 0.12s, color 0.12s;
				pointer-events: auto;
			}

			.hdr-btn:hover { background: rgba(255,255,255,0.08); color: var(--header-primary, #f2f3f5); }
			.hdr-btn.close:hover { background: rgba(216,60,62,0.2); color: #e5534b; }

			/* ── Body ── */
			.quest-body {
				flex: 1;
				overflow-y: auto;
				display: flex;
				flex-direction: column;
			}

			.quest-body::-webkit-scrollbar { width: 6px; }
			.quest-body::-webkit-scrollbar-track { background: transparent; }
			.quest-body::-webkit-scrollbar-thumb {
				background: rgba(255,255,255,0.1);
				border-radius: 3px;
			}
			.quest-body::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }

			/* ── Toolbar ── */
			.qa-toolbar {
				padding: 10px 16px;
				background: var(--background-secondary, #2b2d31);
				border-bottom: 1px solid rgba(255,255,255,0.06);
				display: flex;
				align-items: center;
				gap: 8px;
				flex-shrink: 0;
			}

			.qa-btn {
				border: none;
				padding: 7px 14px;
				border-radius: 6px;
				cursor: pointer;
				font-size: 12.5px;
				font-weight: 600;
				display: flex;
				align-items: center;
				gap: 6px;
				transition: filter 0.12s, opacity 0.12s;
				white-space: nowrap;
				pointer-events: auto;
				font-family: inherit;
			}

			.qa-btn:hover:not(:disabled) { filter: brightness(1.12); }
			.qa-btn:disabled { opacity: 0.4; cursor: not-allowed; }

			.qa-btn.pause  { background: rgba(88,101,242,0.15); color: #8791f7; border: 1px solid rgba(88,101,242,0.25); }
			.qa-btn.resume { background: rgba(35,160,86,0.15);  color: #3ba55d; border: 1px solid rgba(35,160,86,0.25); }
			.qa-btn.skip   { background: rgba(240,178,50,0.12); color: #f0b232; border: 1px solid rgba(240,178,50,0.2); }
			.qa-btn.skip:disabled { opacity: 0.3; }

			.qa-spacer { flex: 1; }

			/* Status pill */
			.qa-status-pill {
				display: flex;
				align-items: center;
				gap: 7px;
				padding: 5px 12px;
				background: var(--background-primary, #313338);
				border: 1px solid rgba(255,255,255,0.07);
				border-radius: 20px;
				font-size: 12px;
				font-weight: 500;
				color: var(--text-muted, #80848e);
			}

			.status-dot {
				width: 7px;
				height: 7px;
				border-radius: 50%;
				background: #80848e;
				flex-shrink: 0;
			}
			.status-dot.running { background: #3ba55d; box-shadow: 0 0 6px rgba(59,165,93,0.5); }
			.status-dot.paused  { background: #f0b232; box-shadow: 0 0 6px rgba(240,178,50,0.4); }
			.status-dot.idle    { background: #80848e; }
			.status-dot.stuck   { background: #e5534b; box-shadow: 0 0 6px rgba(229,83,75,0.5); animation: pulse-red 1s infinite; }

			@keyframes pulse-red {
				0%, 100% { box-shadow: 0 0 4px rgba(229,83,75,0.4); }
				50%       { box-shadow: 0 0 10px rgba(229,83,75,0.8); }
			}

			/* ── Stats strip ── */
			.qa-stats {
				display: flex;
				padding: 12px 16px;
				gap: 8px;
				background: var(--background-secondary-alt, #1e1f22);
				border-bottom: 1px solid rgba(255,255,255,0.05);
				flex-shrink: 0;
			}

			.stat-pill {
				flex: 1;
				background: var(--background-secondary, #2b2d31);
				border: 1px solid rgba(255,255,255,0.06);
				border-radius: 8px;
				padding: 10px 14px;
				display: flex;
				flex-direction: column;
				gap: 2px;
			}

			.stat-pill-label {
				font-size: 10.5px;
				font-weight: 600;
				color: var(--text-muted, #80848e);
				text-transform: uppercase;
				letter-spacing: 0.6px;
			}

			.stat-pill-value {
				font-size: 22px;
				font-weight: 700;
				color: var(--header-primary, #f2f3f5);
				line-height: 1;
			}

			.stat-pill-value.blue   { color: #5865f2; }
			.stat-pill-value.green  { color: #3ba55d; }

			/* ── Quest list ── */
			.qa-list { flex: 1; }

			.quest-item {
				padding: 14px 16px;
				border-bottom: 1px solid rgba(255,255,255,0.05);
				transition: background 0.12s;
				position: relative;
			}

			.quest-item:hover { background: rgba(255,255,255,0.02); }

			.quest-item.active {
				background: rgba(88,101,242,0.06);
				border-left: 3px solid #5865f2;
				padding-left: 13px;
			}

			.quest-item.completed {
				opacity: 0.55;
				border-left: 3px solid #3ba55d;
				padding-left: 13px;
			}

			.quest-item.stuck-warning {
				border-left: 3px solid #e5534b;
				padding-left: 13px;
				background: rgba(229,83,75,0.05);
			}

			.quest-row {
				display: flex;
				align-items: flex-start;
				justify-content: space-between;
				gap: 12px;
				margin-bottom: 8px;
			}

			.quest-title-row {
				display: flex;
				align-items: center;
				gap: 8px;
				flex: 1;
				min-width: 0;
			}

			.quest-emoji { font-size: 18px; flex-shrink: 0; }

			.quest-name {
				font-size: 13.5px;
				font-weight: 600;
				color: var(--header-primary, #f2f3f5);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.quest-right {
				display: flex;
				align-items: center;
				gap: 6px;
				flex-shrink: 0;
			}

			.badge {
				padding: 2px 8px;
				border-radius: 6px;
				font-size: 10.5px;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.4px;
			}

			.badge.pending   { background: rgba(255,255,255,0.06); color: #80848e; }
			.badge.active    { background: rgba(88,101,242,0.2);   color: #8791f7; }
			.badge.completed { background: rgba(59,165,93,0.2);    color: #3ba55d; }
			.badge.stuck     { background: rgba(229,83,75,0.2);    color: #e5534b; }

			.skip-btn {
				background: rgba(240,178,50,0.1);
				border: 1px solid rgba(240,178,50,0.2);
				color: #f0b232;
				padding: 2px 9px;
				border-radius: 5px;
				font-size: 10.5px;
				font-weight: 600;
				cursor: pointer;
				font-family: inherit;
				transition: background 0.12s;
				display: none;
			}

			.skip-btn:hover { background: rgba(240,178,50,0.2); }
			.quest-item.active .skip-btn { display: block; }

			.quest-meta {
				font-size: 11.5px;
				color: var(--text-muted, #80848e);
				display: flex;
				align-items: center;
				gap: 6px;
				margin-bottom: 8px;
			}

			.meta-tag {
				background: rgba(255,255,255,0.05);
				border: 1px solid rgba(255,255,255,0.07);
				padding: 1px 7px;
				border-radius: 4px;
				font-size: 10px;
				font-weight: 600;
				text-transform: uppercase;
				letter-spacing: 0.3px;
			}

			/* Progress */
			.qa-progress-bar {
				width: 100%;
				height: 5px;
				background: rgba(255,255,255,0.07);
				border-radius: 3px;
				overflow: hidden;
			}

			.qa-progress-fill {
				height: 100%;
				border-radius: 3px;
				transition: width 0.4s ease;
				background: rgba(255,255,255,0.2);
			}

			.qa-progress-fill.active    { background: linear-gradient(90deg, #5865f2, #7c84f5); }
			.qa-progress-fill.completed { background: #3ba55d; }
			.qa-progress-fill.stuck     { background: #e5534b; }

			.qa-progress-info {
				display: flex;
				justify-content: space-between;
				font-size: 11px;
				color: var(--text-muted, #80848e);
				margin-top: 5px;
			}

			.qa-progress-info span:first-child { font-weight: 600; }

			/* ── Log ── */
			.qa-log {
				background: var(--background-secondary-alt, #1e1f22);
				border-top: 1px solid rgba(255,255,255,0.06);
				max-height: 160px;
				display: flex;
				flex-direction: column;
				flex-shrink: 0;
			}

			.qa-log-header {
				padding: 7px 16px;
				display: flex;
				align-items: center;
				justify-content: space-between;
				border-bottom: 1px solid rgba(255,255,255,0.05);
				flex-shrink: 0;
			}

			.qa-log-title {
				font-size: 10.5px;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.7px;
				color: var(--text-muted, #80848e);
			}

			.qa-log-clear {
				background: none;
				border: none;
				color: var(--text-muted, #80848e);
				font-size: 10px;
				cursor: pointer;
				font-family: inherit;
				padding: 0;
				transition: color 0.12s;
			}

			.qa-log-clear:hover { color: var(--header-primary, #f2f3f5); }

			.qa-log-scroll {
				flex: 1;
				overflow-y: auto;
				padding: 6px 0;
			}

			.qa-log-scroll::-webkit-scrollbar { width: 4px; }
			.qa-log-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

			.log-entry {
				padding: 3px 16px;
				display: flex;
				align-items: baseline;
				gap: 10px;
				font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
				font-size: 11.5px;
				line-height: 1.5;
			}

			.log-entry:hover { background: rgba(255,255,255,0.02); }

			.log-time { color: var(--text-muted, #80848e); flex-shrink: 0; font-size: 10.5px; }
			.log-msg  { flex: 1; }

			.log-info    { color: #949ba4; }
			.log-success { color: #3ba55d; }
			.log-warning { color: #f0b232; }
			.log-error   { color: #e5534b; }

			/* ── Empty state ── */
			.qa-empty {
				padding: 56px 24px;
				text-align: center;
			}

			.qa-empty-icon { font-size: 44px; opacity: 0.35; margin-bottom: 14px; }

			.qa-empty h3 {
				font-size: 16px;
				font-weight: 700;
				color: var(--header-primary, #f2f3f5);
				margin: 0 0 6px;
			}

			.qa-empty p {
				font-size: 13px;
				color: var(--text-muted, #80848e);
				margin: 0;
			}

			/* ── Confirm modal ── */
			.qa-confirm-overlay {
				position: fixed;
				inset: 0;
				background: rgba(0,0,0,0.75);
				z-index: 999999;
				display: flex;
				align-items: center;
				justify-content: center;
				animation: fadeIn 0.12s ease;
			}

			@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

			.qa-confirm-modal {
				background: var(--background-primary, #313338);
				border-radius: 10px;
				padding: 24px;
				width: 400px;
				box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06);
			}

			.qa-confirm-title {
				font-size: 18px;
				font-weight: 700;
				color: var(--header-primary, #f2f3f5);
				margin-bottom: 10px;
			}

			.qa-confirm-body {
				font-size: 13.5px;
				color: var(--text-normal, #dbdee1);
				line-height: 1.6;
				margin-bottom: 20px;
			}

			.qa-confirm-footer {
				display: flex;
				gap: 10px;
				justify-content: flex-end;
			}

			.qa-confirm-footer .qa-btn {
				padding: 8px 18px;
				font-size: 13px;
			}

			.qa-btn.neutral { background: rgba(255,255,255,0.07); color: var(--text-normal, #dbdee1); border: 1px solid rgba(255,255,255,0.1); }
			.qa-btn.danger  { background: rgba(229,83,75,0.2); color: #e5534b; border: 1px solid rgba(229,83,75,0.3); }
		</style>

		<div class="qa-header">
			<div class="qa-header-left">
				<div class="qa-logo">🎮</div>
				<span class="qa-title">Quest Automator</span>
				<span class="qa-badge">v4.0</span>
			</div>
			<div class="qa-header-controls">
				<button class="hdr-btn" id="qa-minimize-btn" title="Minimize">─</button>
				<button class="hdr-btn close" id="qa-close-btn" title="Close">✕</button>
			</div>
		</div>

		<div class="quest-body">
			<div class="qa-toolbar">
				<button class="qa-btn pause" id="qa-pause-btn" disabled>
					<span id="qa-pause-icon">⏸</span>
					<span id="qa-pause-text">Pause</span>
				</button>
				<button class="qa-btn skip" id="qa-skip-btn" disabled title="Skip current quest">
					⏭ Skip Quest
				</button>
				<div class="qa-spacer"></div>
				<div class="qa-status-pill">
					<span class="status-dot idle" id="qa-status-dot"></span>
					<span id="qa-status-text">Idle</span>
				</div>
				<span style="font-size: 11.5px; color: var(--text-muted,#80848e);" id="qa-counter"></span>
			</div>

			<div class="qa-stats">
				<div class="stat-pill">
					<div class="stat-pill-label">Total</div>
					<div class="stat-pill-value" id="qa-total">0</div>
				</div>
				<div class="stat-pill">
					<div class="stat-pill-label">Remaining</div>
					<div class="stat-pill-value blue" id="qa-active">0</div>
				</div>
				<div class="stat-pill">
					<div class="stat-pill-label">Done</div>
					<div class="stat-pill-value green" id="qa-completed">0</div>
				</div>
			</div>

			<div class="qa-list" id="qa-quest-list"></div>

			<div class="qa-log">
				<div class="qa-log-header">
					<span class="qa-log-title">Activity Log</span>
					<button class="qa-log-clear" id="qa-log-clear">Clear</button>
				</div>
				<div class="qa-log-scroll" id="qa-log-scroll">
					<div id="qa-log-content"></div>
				</div>
			</div>
		</div>
	`;

	document.body.appendChild(container);
	makeDraggable(container, container.querySelector('.qa-header'));

	document.getElementById('qa-minimize-btn').addEventListener('click', e => {
		e.stopPropagation();
		const ui = document.getElementById('quest-automator-ui');
		const isMin = ui.classList.toggle('minimized');
		document.getElementById('qa-minimize-btn').textContent = isMin ? '+' : '─';
	});

	document.getElementById('qa-close-btn').addEventListener('click', e => {
		e.stopPropagation();
		attemptClose();
	});

	document.getElementById('qa-pause-btn').addEventListener('click', e => {
		e.stopPropagation();
		togglePause();
	});

	document.getElementById('qa-skip-btn').addEventListener('click', e => {
		e.stopPropagation();
		requestSkip();
	});

	document.getElementById('qa-log-clear').addEventListener('click', () => {
		const content = document.getElementById('qa-log-content');
		if (content) content.innerHTML = '';
	});

	return container;
}

// ─── Draggable ────────────────────────────────────────────────────────────────

function makeDraggable(element, handle) {
	let ox = 0, oy = 0, sx = 0, sy = 0;

	handle.onmousedown = e => {
		if (e.target.closest('button')) return;
		e.preventDefault();
		sx = e.clientX; sy = e.clientY;
		document.onmousemove = ev => {
			ev.preventDefault();
			ox = sx - ev.clientX; oy = sy - ev.clientY;
			sx = ev.clientX;     sy = ev.clientY;
			element.style.top = (element.offsetTop - oy) + 'px';
			element.style.left = (element.offsetLeft - ox) + 'px';
			element.style.transform = 'none';
		};
		document.onmouseup = () => {
			document.onmousemove = null;
			document.onmouseup = null;
		};
	};
}

// ─── Controls ─────────────────────────────────────────────────────────────────

function togglePause() {
	AutomatorState.isPaused = !AutomatorState.isPaused;
	const btn = document.getElementById('qa-pause-btn');
	const icon = document.getElementById('qa-pause-icon');
	const text = document.getElementById('qa-pause-text');

	if (AutomatorState.isPaused) {
		btn.className = 'qa-btn resume';
		icon.textContent = '▶';
		text.textContent = 'Resume';
		setStatus('paused', 'Paused');
		addLog('⏸ Paused', 'warning');
		clearStuckWatchdog();
	} else {
		btn.className = 'qa-btn pause';
		icon.textContent = '⏸';
		text.textContent = 'Pause';
		setStatus('running', 'Running');
		addLog('▶ Resumed', 'success');
		resetStuckWatchdog();
	}
}

function requestSkip() {
	if (!AutomatorState.isRunning || AutomatorState.isPaused) return;
	AutomatorState.skipRequested = true;
	addLog('⏭ Skip requested — finishing current tick…', 'warning');
}

function attemptClose() {
	const remaining = AutomatorState.totalQuests - AutomatorState.completedQuests;
	if (remaining > 0 && AutomatorState.isRunning) {
		showConfirmation(
			'Close Quest Automator?',
			`${remaining} quest${remaining !== 1 ? 's' : ''} still in progress. Close anyway?`,
			() => document.getElementById('quest-automator-ui')?.remove()
		);
	} else {
		document.getElementById('quest-automator-ui')?.remove();
	}
}

function showConfirmation(title, message, onConfirm) {
	const overlay = document.createElement('div');
	overlay.className = 'qa-confirm-overlay';
	overlay.innerHTML = `
		<div class="qa-confirm-modal">
			<div class="qa-confirm-title">${title}</div>
			<div class="qa-confirm-body">${message}</div>
			<div class="qa-confirm-footer">
				<button class="qa-btn neutral" id="qa-cancel">Cancel</button>
				<button class="qa-btn danger"  id="qa-confirm">Close</button>
			</div>
		</div>
	`;
	document.body.appendChild(overlay);
	overlay.querySelector('#qa-cancel').addEventListener('click', () => overlay.remove());
	overlay.querySelector('#qa-confirm').addEventListener('click', () => { overlay.remove(); onConfirm(); });
}

// ─── Stuck watchdog ───────────────────────────────────────────────────────────

function resetStuckWatchdog() {
	clearStuckWatchdog();
	if (!AutomatorState.isRunning || AutomatorState.isPaused) return;
	AutomatorState.lastProgressTime = Date.now();
	AutomatorState.stuckWatchdogTimer = setTimeout(() => {
		if (!AutomatorState.isRunning || AutomatorState.isPaused || AutomatorState.skipRequested) return;
		const questEl = AutomatorState.activeQuestId
			? document.getElementById(`quest-${AutomatorState.activeQuestId}`)
			: null;
		if (questEl) questEl.classList.add('stuck-warning');
		setStatus('stuck', 'Stuck?');
		addLog('⚠ No progress in 90s — auto-skipping stuck quest', 'error');
		AutomatorState.skipRequested = true;
	}, AutomatorState.STUCK_TIMEOUT_MS);
}

function clearStuckWatchdog() {
	if (AutomatorState.stuckWatchdogTimer) {
		clearTimeout(AutomatorState.stuckWatchdogTimer);
		AutomatorState.stuckWatchdogTimer = null;
	}
}

function onProgressMade() {
	// Remove stuck styling from active quest
	if (AutomatorState.activeQuestId) {
		const el = document.getElementById(`quest-${AutomatorState.activeQuestId}`);
		if (el) el.classList.remove('stuck-warning');
	}
	if (AutomatorState.isRunning && !AutomatorState.isPaused) {
		setStatus('running', 'Running');
	}
	resetStuckWatchdog();
}

// ─── Log ──────────────────────────────────────────────────────────────────────

function addLog(message, type = 'info') {
	const content = document.getElementById('qa-log-content');
	const scroll  = document.getElementById('qa-log-scroll');
	if (!content) return;

	const entry = document.createElement('div');
	entry.className = 'log-entry';
	entry.innerHTML = `
		<span class="log-time">${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>
		<span class="log-msg log-${type}">${message}</span>
	`;
	content.appendChild(entry);
	if (scroll) scroll.scrollTop = scroll.scrollHeight;

	console.log(`%c[QA] ${message}`, `color:${
		type === 'success' ? '#3ba55d' :
		type === 'error'   ? '#e5534b' :
		type === 'warning' ? '#f0b232' : '#5865f2'
	};font-weight:600`);
}

// ─── Status ───────────────────────────────────────────────────────────────────

function setStatus(state, text) {
	const dot = document.getElementById('qa-status-dot');
	const lbl = document.getElementById('qa-status-text');
	if (dot) dot.className = `status-dot ${state}`;
	if (lbl) lbl.textContent = text;

	const pauseBtn = document.getElementById('qa-pause-btn');
	const skipBtn  = document.getElementById('qa-skip-btn');
	const idle = state === 'idle' || text === 'Complete';
	if (pauseBtn) pauseBtn.disabled = idle;
	if (skipBtn)  skipBtn.disabled  = idle || state === 'paused';
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function updateStats(total, remaining, completed) {
	const t = document.getElementById('qa-total');
	const a = document.getElementById('qa-active');
	const c = document.getElementById('qa-completed');
	const k = document.getElementById('qa-counter');
	if (t) t.textContent = total;
	if (a) a.textContent = remaining;
	if (c) c.textContent = completed;
	if (k) k.textContent = `${completed} / ${total}`;
}

// ─── Quest display ────────────────────────────────────────────────────────────

function updateQuestDisplay(quests, activeQuestId = null) {
	const list = document.getElementById('qa-quest-list');
	if (!list) return;

	if (!quests.length) {
		list.innerHTML = `
			<div class="qa-empty">
				<div class="qa-empty-icon">✨</div>
				<h3>All done!</h3>
				<p>No active quests found in your account.</p>
			</div>`;
		return;
	}

	list.innerHTML = quests.map(quest => {
		const taskConfig   = quest.config.taskConfig ?? quest.config.taskConfigV2;
		const taskName     = supportedTasks.find(x => taskConfig.tasks[x] != null);
		const emoji        = taskEmojis[taskName] || '⚡';
		const secondsNeeded = taskConfig.tasks[taskName].target;
		const secondsDone  = quest.userStatus?.progress?.[taskName]?.value ?? 0;
		const pct          = Math.min(100, Math.floor((secondsDone / secondsNeeded) * 100));
		const timeLeft     = Math.ceil((secondsNeeded - secondsDone) / 60);

		const isActive    = quest.id === activeQuestId;
		const isCompleted = !!quest.userStatus?.completedAt;
		const statusClass = isCompleted ? 'completed' : isActive ? 'active' : 'pending';
		const statusLabel = isCompleted ? 'Done' : isActive ? 'Active' : 'Pending';
		const itemClass   = isCompleted ? 'quest-item completed' : isActive ? 'quest-item active' : 'quest-item';
		const fillClass   = isCompleted ? 'completed' : isActive ? 'active' : '';

		return `
			<div class="${itemClass}" id="quest-${quest.id}">
				<div class="quest-row">
					<div class="quest-title-row">
						<span class="quest-emoji">${emoji}</span>
						<span class="quest-name" title="${quest.config.messages.questName}">${quest.config.messages.questName}</span>
					</div>
					<div class="quest-right">
						<button class="skip-btn" onclick="(function(){window._qaSkipCurrent && window._qaSkipCurrent()})()">Skip</button>
						<span class="badge ${statusClass}">${statusLabel}</span>
					</div>
				</div>
				<div class="quest-meta">
					${quest.config.application.name}
					<span class="meta-tag">${taskName.replace(/_/g,' ')}</span>
				</div>
				<div class="qa-progress-bar">
					<div class="qa-progress-fill ${fillClass}" style="width:${pct}%"></div>
				</div>
				<div class="qa-progress-info">
					<span>${pct}%</span>
					<span>${isCompleted ? 'Completed' : `~${timeLeft}m left · ${secondsDone}/${secondsNeeded}s`}</span>
				</div>
			</div>`;
	}).join('');
}

function updateQuestProgress(questId, progress, total) {
	const el = document.getElementById(`quest-${questId}`);
	if (!el) return;

	const pct      = Math.min(100, Math.floor((progress / total) * 100));
	const timeLeft = Math.ceil((total - progress) / 60);

	const fill = el.querySelector('.qa-progress-fill');
	const info = el.querySelector('.qa-progress-info');

	if (fill) fill.style.width = `${pct}%`;
	if (info) info.innerHTML = `
		<span>${pct}%</span>
		<span>~${timeLeft}m left · ${progress}/${total}s</span>
	`;
}

// ─── Main automation ──────────────────────────────────────────────────────────

createQuestUI();
addLog('🚀 Quest Automator v4.0 initialized', 'info');
addLog('Connecting to Discord internals…', 'info');

delete window.$;
let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
webpackChunkdiscord_app.pop();

let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.Z;
let RunningGameStore, QuestsStore, ChannelStore, GuildChannelStore, FluxDispatcher, api;

if (!ApplicationStreamingStore) {
	ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getStreamerActiveStreamMetadata).exports.A;
	RunningGameStore  = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getRunningGames).exports.Ay;
	QuestsStore       = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getQuest).exports.A;
	ChannelStore      = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getAllThreadsForParent).exports.A;
	GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getSFWDefaultChannel).exports.Ay;
	FluxDispatcher    = Object.values(wpRequire.c).find(x => x?.exports?.h?.__proto__?.flushWaitQueue).exports.h;
	api               = Object.values(wpRequire.c).find(x => x?.exports?.Bo?.get).exports.Bo;
} else {
	RunningGameStore  = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getRunningGames).exports.ZP;
	QuestsStore       = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest).exports.Z;
	ChannelStore      = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getAllThreadsForParent).exports.Z;
	GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getSFWDefaultChannel).exports.ZP;
	FluxDispatcher    = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.flushWaitQueue).exports.Z;
	api               = Object.values(wpRequire.c).find(x => x?.exports?.tn?.get).exports.tn;
}

addLog('✓ Connected to Discord', 'success');

const supportedTasks = ['WATCH_VIDEO', 'PLAY_ON_DESKTOP', 'STREAM_ON_DESKTOP', 'PLAY_ACTIVITY', 'WATCH_VIDEO_ON_MOBILE'];
const taskEmojis = {
	WATCH_VIDEO: '📺', WATCH_VIDEO_ON_MOBILE: '📱',
	PLAY_ON_DESKTOP: '🎮', STREAM_ON_DESKTOP: '📡', PLAY_ACTIVITY: '🎯',
};

addLog('Scanning quests…', 'info');

let quests = [...QuestsStore.quests.values()].filter(x =>
	x.userStatus?.enrolledAt &&
	!x.userStatus?.completedAt &&
	new Date(x.config.expiresAt).getTime() > Date.now() &&
	supportedTasks.find(y => Object.keys((x.config.taskConfig ?? x.config.taskConfigV2).tasks).includes(y))
);

const isApp = typeof DiscordNative !== 'undefined';

AutomatorState.totalQuests = quests.length;
AutomatorState.completedQuests = 0;

updateStats(AutomatorState.totalQuests, AutomatorState.totalQuests, 0);
updateQuestDisplay(quests);

if (!quests.length) {
	addLog('No active quests found', 'warning');
	setStatus('idle', 'Idle');
} else {
	addLog(`Found ${AutomatorState.totalQuests} quest(s)`, 'success');
	AutomatorState.isRunning = true;
	setStatus('running', 'Running');
	resetStuckWatchdog();

	// Expose skip trigger globally for per-quest skip buttons
	window._qaSkipCurrent = () => requestSkip();

	async function doJob() {
		// Drain any pending skip before popping next quest
		if (AutomatorState.skipRequested) {
			AutomatorState.skipRequested = false;
			clearStuckWatchdog();
			if (AutomatorState.activeQuestId) {
				document.getElementById(`quest-${AutomatorState.activeQuestId}`)?.classList.remove('stuck-warning');
			}
		}

		while (AutomatorState.isPaused) await sleep(1000);

		const quest = quests.pop();
		if (!quest) {
			addLog('🎉 All quests completed!', 'success');
			updateStats(AutomatorState.totalQuests, 0, AutomatorState.completedQuests);
			setStatus('idle', 'Complete');
			clearStuckWatchdog();
			AutomatorState.isRunning = false;
			document.getElementById('qa-skip-btn').disabled = true;
			return;
		}

		const pid             = Math.floor(Math.random() * 30000) + 1000;
		const applicationId   = quest.config.application.id;
		const applicationName = quest.config.application.name;
		const questName       = quest.config.messages.questName;
		const taskConfig      = quest.config.taskConfig ?? quest.config.taskConfigV2;
		const taskName        = supportedTasks.find(x => taskConfig.tasks[x] != null);
		const secondsNeeded   = taskConfig.tasks[taskName].target;
		let   secondsDone     = quest.userStatus?.progress?.[taskName]?.value ?? 0;

		AutomatorState.activeQuestId = quest.id;
		updateQuestDisplay([quest, ...quests], quest.id);
		addLog(`▶ Processing: ${questName}`, 'info');
		resetStuckWatchdog();

		// ── WATCH_VIDEO / WATCH_VIDEO_ON_MOBILE ──────────────────────────────
		if (taskName === 'WATCH_VIDEO' || taskName === 'WATCH_VIDEO_ON_MOBILE') {
			addLog('📺 Video quest — fast-forwarding…', 'info');
			const speed = 7;
			let completed = false;

			while (true) {
				if (AutomatorState.skipRequested) break;
				while (AutomatorState.isPaused) await sleep(1000);
				if (AutomatorState.skipRequested) break;

				// Wait real-time for the current chunk (matches original pacing)
				const remaining = Math.min(speed, secondsNeeded - secondsDone);
				await sleep(remaining * 1000);
				if (AutomatorState.skipRequested) break;

				const ts  = Math.min(secondsNeeded, secondsDone + speed + Math.random());
				const res = await api.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: ts } });
				completed   = res.body.completed_at != null;
				secondsDone = Math.min(secondsNeeded, secondsDone + speed);
				updateQuestProgress(quest.id, secondsDone, secondsNeeded);
				onProgressMade();

				if (secondsDone >= secondsNeeded) break;
			}

			if (!AutomatorState.skipRequested && !completed) {
				await api.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: secondsNeeded } });
			}

		// ── PLAY_ON_DESKTOP ──────────────────────────────────────────────────
		} else if (taskName === 'PLAY_ON_DESKTOP') {
			if (!isApp) {
				addLog('❌ Desktop App required for this quest — skipping', 'error');
				AutomatorState.skipRequested = true;
			} else {
				addLog(`🎮 Spoofing game: ${applicationName}`, 'info');
				const appRes  = await api.get({ url: `/applications/public?application_ids=${applicationId}` });
				const appData = appRes.body[0];
				const exeName = appData.executables?.find(x => x.os === 'win32')?.name?.replace('>', '')
				             ?? appData.name.replace(/[\/\\:*?"<>|]/g, '') + '.exe';

				const fakeGame = {
					cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
					exeName, exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
					hidden: false, isLauncher: false, id: applicationId,
					name: appData.name, pid, pidPath: [pid],
					processName: appData.name, start: Date.now(),
				};

				const realGames           = RunningGameStore.getRunningGames();
				const realGetRunningGames = RunningGameStore.getRunningGames;
				const realGetGameForPID   = RunningGameStore.getGameForPID;
				const fakeGames           = [fakeGame];

				RunningGameStore.getRunningGames = () => fakeGames;
				RunningGameStore.getGameForPID   = p => fakeGames.find(x => x.pid === p);
				FluxDispatcher.dispatch({ type: 'RUNNING_GAMES_CHANGE', removed: realGames, added: [fakeGame], games: fakeGames });
				addLog(`✓ Spoofed ${applicationName} — waiting for heartbeats`, 'success');

				await new Promise(resolve => {
					const cleanup = () => {
						RunningGameStore.getRunningGames = realGetRunningGames;
						RunningGameStore.getGameForPID   = realGetGameForPID;
						FluxDispatcher.dispatch({ type: 'RUNNING_GAMES_CHANGE', removed: [fakeGame], added: [], games: [] });
						FluxDispatcher.unsubscribe('QUESTS_SEND_HEARTBEAT_SUCCESS', fn);
						clearInterval(skipPoll);
					};
					const skipPoll = setInterval(() => {
						if (AutomatorState.skipRequested) { cleanup(); resolve(); }
					}, 2000);
					const fn = data => {
						if (AutomatorState.skipRequested) { cleanup(); resolve(); return; }
						if (AutomatorState.isPaused) return;
						const progress = quest.config.configVersion === 1
							? data.userStatus.streamProgressSeconds
							: Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
						updateQuestProgress(quest.id, progress, secondsNeeded);
						onProgressMade();
						if (progress >= secondsNeeded) { cleanup(); resolve(); }
					};
					FluxDispatcher.subscribe('QUESTS_SEND_HEARTBEAT_SUCCESS', fn);
				});
			}

		// ── STREAM_ON_DESKTOP ────────────────────────────────────────────────
		} else if (taskName === 'STREAM_ON_DESKTOP') {
			if (!isApp) {
				addLog('❌ Desktop App required for this quest — skipping', 'error');
				AutomatorState.skipRequested = true;
			} else {
				addLog('📡 Spoofing stream… (need 1+ person in VC)', 'warning');
				const realStreamMeta = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
				ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({ id: applicationId, pid, sourceName: null });
				addLog('✓ Spoofed stream metadata', 'success');

				await new Promise(resolve => {
					const cleanup = () => {
						ApplicationStreamingStore.getStreamerActiveStreamMetadata = realStreamMeta;
						FluxDispatcher.unsubscribe('QUESTS_SEND_HEARTBEAT_SUCCESS', fn);
						clearInterval(skipPoll);
					};
					const skipPoll = setInterval(() => {
						if (AutomatorState.skipRequested) { cleanup(); resolve(); }
					}, 2000);
					const fn = data => {
						if (AutomatorState.skipRequested) { cleanup(); resolve(); return; }
						if (AutomatorState.isPaused) return;
						const progress = quest.config.configVersion === 1
							? data.userStatus.streamProgressSeconds
							: Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
						updateQuestProgress(quest.id, progress, secondsNeeded);
						onProgressMade();
						if (progress >= secondsNeeded) { cleanup(); resolve(); }
					};
					FluxDispatcher.subscribe('QUESTS_SEND_HEARTBEAT_SUCCESS', fn);
				});
			}

		// ── PLAY_ACTIVITY ────────────────────────────────────────────────────
		} else if (taskName === 'PLAY_ACTIVITY') {
			addLog('🎯 Activity quest — sending heartbeats…', 'info');
			const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id
			               ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x?.VOCAL?.length > 0).VOCAL[0].channel.id;
			const streamKey = `call:${channelId}:1`;

			while (true) {
				if (AutomatorState.skipRequested) break;
				while (AutomatorState.isPaused) await sleep(1000);
				if (AutomatorState.skipRequested) break;

				const res      = await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: false } });
				const progress = res.body.progress.PLAY_ACTIVITY.value;
				updateQuestProgress(quest.id, progress, secondsNeeded);
				onProgressMade();

				if (progress >= secondsNeeded) {
					await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: true } });
					break;
				}
				await sleep(20_000);
			}
		}

		// ── Wrap up ──────────────────────────────────────────────────────────
		const wasSkipped = AutomatorState.skipRequested;
		AutomatorState.skipRequested = false;

		if (!wasSkipped) {
			quest.userStatus.completedAt = new Date();
			addLog(`✅ "${questName}" completed`, 'success');
		} else {
			addLog(`⏭ "${questName}" skipped`, 'warning');
		}

		// Recalculate from queue length — never drift from source of truth
		const remaining = quests.length;
		const completed = AutomatorState.totalQuests - remaining - (wasSkipped ? 1 : 0);
		AutomatorState.completedQuests = Math.max(0, completed);

		updateQuestDisplay([quest, ...quests]);
		updateStats(AutomatorState.totalQuests, remaining, AutomatorState.completedQuests);

		await sleep(1000);
		doJob();
	}

	doJob();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
