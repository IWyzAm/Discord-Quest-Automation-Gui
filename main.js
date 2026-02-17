// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 DISCORD QUEST AUTOMATOR v3.0 - GITHUB EDITION
// ═══════════════════════════════════════════════════════════════════════════════

// Global state management
const AutomatorState = {
	isPaused: false,
	isRunning: false,
	activeQuestId: null,
	completedQuests: 0,
	totalQuests: 0
};

// Create the main UI overlay with Discord's native colors
function createQuestUI() {
	const existing = document.getElementById('quest-automator-ui');
	if (existing) existing.remove();

	const container = document.createElement('div');
	container.id = 'quest-automator-ui';
	container.innerHTML = `
		<style>
			/* Use Discord's native CSS variables */
			#quest-automator-ui {
				position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				width: 800px;
				max-height: 85vh;
				background: var(--background-primary, #36393f);
				border-radius: 8px;
				box-shadow: 0 8px 16px rgba(0, 0, 0, 0.24);
				z-index: 99999;
				font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
				color: var(--text-normal, #dcddde);
				overflow: hidden;
				border: 1px solid var(--background-tertiary, #202225);
				display: flex;
				flex-direction: column;
			}

			#quest-automator-ui.minimized {
				width: 350px;
				height: 52px;
				max-height: 52px;
			}

			#quest-automator-ui.minimized .quest-body {
				display: none;
			}

			/* Header - GitHub inspired */
			.quest-header {
				background: var(--background-secondary, #2f3136);
				padding: 14px 16px;
				border-bottom: 1px solid var(--background-modifier-accent, #4f545c);
				display: flex;
				align-items: center;
				justify-content: space-between;
				cursor: move;
				user-select: none;
			}

			.quest-header-left {
				display: flex;
				align-items: center;
				gap: 12px;
			}

			.quest-header-title {
				display: flex;
				align-items: center;
				gap: 8px;
				font-size: 16px;
				font-weight: 600;
				color: var(--header-primary, #fff);
			}

			.quest-header-badge {
				background: var(--brand-experiment, #5865f2);
				color: white;
				padding: 2px 8px;
				border-radius: 12px;
				font-size: 11px;
				font-weight: 600;
				text-transform: uppercase;
			}

			.quest-header-controls {
				display: flex;
				align-items: center;
				gap: 8px;
				position: relative;
				z-index: 10;
			}

			.header-btn {
				background: transparent;
				border: none;
				color: var(--interactive-normal, #b9bbbe);
				width: 32px;
				height: 32px;
				border-radius: 4px;
				cursor: pointer;
				font-size: 16px;
				display: flex;
				align-items: center;
				justify-content: center;
				transition: all 0.15s ease;
				position: relative;
				z-index: 11;
				pointer-events: auto;
			}

			.header-btn:hover {
				background: var(--background-modifier-hover, #40444b);
				color: var(--interactive-hover, #dcddde);
			}

			.header-btn.close:hover {
				background: var(--button-danger-background, #d83c3e);
				color: white;
			}

			/* Main content area */
			.quest-body {
				flex: 1;
				overflow-y: auto;
				background: var(--background-primary, #36393f);
			}

			.quest-body::-webkit-scrollbar {
				width: 16px;
			}

			.quest-body::-webkit-scrollbar-track {
				background: var(--background-primary, #36393f);
			}

			.quest-body::-webkit-scrollbar-thumb {
				background-color: var(--background-tertiary, #202225);
				border: 4px solid var(--background-primary, #36393f);
				border-radius: 8px;
			}

			.quest-body::-webkit-scrollbar-thumb:hover {
				background-color: var(--background-modifier-accent, #4f545c);
			}

			/* Control bar - GitHub actions style */
			.control-bar {
				background: var(--background-secondary, #2f3136);
				padding: 12px 16px;
				border-bottom: 1px solid var(--background-modifier-accent, #4f545c);
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 12px;
			}

			.control-bar-left {
				display: flex;
				align-items: center;
				gap: 8px;
			}

			.control-bar-right {
				display: flex;
				align-items: center;
				gap: 12px;
			}

			.control-btn {
				background: var(--button-secondary-background, #4f545c);
				border: none;
				color: var(--text-normal, #fff);
				padding: 8px 16px;
				border-radius: 4px;
				cursor: pointer;
				font-size: 13px;
				font-weight: 500;
				display: flex;
				align-items: center;
				gap: 6px;
				transition: all 0.15s ease;
				pointer-events: auto;
				position: relative;
				z-index: 1;
			}

			.control-btn:hover {
				background: var(--button-secondary-background-hover, #5d6269);
			}

			.control-btn:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}

			.control-btn.primary {
				background: var(--brand-experiment, #5865f2);
				color: white;
			}

			.control-btn.primary:hover {
				background: var(--brand-experiment-hover, #4752c4);
			}

			.control-btn.danger {
				background: var(--button-danger-background, #d83c3e);
				color: white;
			}

			.control-btn.danger:hover {
				background: var(--button-danger-background-hover, #a12d2f);
			}

			.control-btn.success {
				background: var(--button-positive-background, #248046);
				color: white;
			}

			.control-btn.success:hover {
				background: var(--button-positive-background-hover, #1a6334);
			}

			.status-indicator {
				display: flex;
				align-items: center;
				gap: 6px;
				font-size: 13px;
				color: var(--text-muted, #96989d);
			}

			.status-dot {
				width: 8px;
				height: 8px;
				border-radius: 50%;
				background: var(--status-positive, #23a55a);
			}

			.status-dot.paused {
				background: var(--status-warning, #f0b232);
			}

			.status-dot.idle {
				background: var(--status-danger, #f23f42);
			}

			/* Stats section - GitHub contribution style */
			.stats-section {
				padding: 16px;
				background: var(--background-secondary, #2f3136);
				border-bottom: 1px solid var(--background-modifier-accent, #4f545c);
			}

			.stats-grid {
				display: grid;
				grid-template-columns: repeat(3, 1fr);
				gap: 12px;
			}

			.stat-card {
				background: var(--background-secondary-alt, #292b2f);
				padding: 12px;
				border-radius: 6px;
				border: 1px solid var(--background-modifier-accent, #4f545c);
			}

			.stat-label {
				font-size: 12px;
				color: var(--text-muted, #96989d);
				margin-bottom: 4px;
				text-transform: uppercase;
				font-weight: 600;
				letter-spacing: 0.5px;
			}

			.stat-value {
				font-size: 24px;
				font-weight: 700;
				color: var(--header-primary, #fff);
			}

			.stat-value.active {
				color: var(--brand-experiment, #5865f2);
			}

			.stat-value.completed {
				color: var(--button-positive-background, #248046);
			}

			/* Quest list - Linear GitHub style */
			.quest-list {
				padding: 0;
			}

			.quest-item {
				background: var(--background-primary, #36393f);
				border-bottom: 1px solid var(--background-modifier-accent, #4f545c);
				padding: 16px;
				transition: background 0.15s ease;
			}

			.quest-item:hover {
				background: var(--background-secondary, #2f3136);
			}

			.quest-item.active {
				background: var(--background-secondary, #2f3136);
				border-left: 3px solid var(--brand-experiment, #5865f2);
			}

			.quest-item.completed {
				opacity: 0.6;
				border-left: 3px solid var(--button-positive-background, #248046);
			}

			.quest-header-row {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-bottom: 8px;
			}

			.quest-title-section {
				display: flex;
				align-items: center;
				gap: 8px;
			}

			.quest-icon {
				font-size: 20px;
			}

			.quest-name {
				font-size: 14px;
				font-weight: 600;
				color: var(--header-primary, #fff);
			}

			.quest-status-badge {
				padding: 3px 8px;
				border-radius: 12px;
				font-size: 11px;
				font-weight: 600;
				text-transform: uppercase;
			}

			.quest-status-badge.pending {
				background: var(--background-modifier-accent, #4f545c);
				color: var(--text-muted, #96989d);
			}

			.quest-status-badge.active {
				background: var(--brand-experiment, #5865f2);
				color: white;
			}

			.quest-status-badge.completed {
				background: var(--button-positive-background, #248046);
				color: white;
			}

			.quest-meta {
				font-size: 13px;
				color: var(--text-muted, #96989d);
				margin-bottom: 8px;
			}

			.quest-type-tag {
				display: inline-block;
				background: var(--background-modifier-accent, #4f545c);
				padding: 2px 8px;
				border-radius: 3px;
				font-size: 11px;
				font-weight: 600;
				margin-bottom: 8px;
			}

			/* Progress bar - GitHub PR style */
			.progress-container {
				margin-top: 8px;
			}

			.progress-bar {
				width: 100%;
				height: 6px;
				background: var(--background-modifier-accent, #4f545c);
				border-radius: 3px;
				overflow: hidden;
			}

			.progress-fill {
				height: 100%;
				background: var(--button-positive-background, #248046);
				border-radius: 3px;
				transition: width 0.3s ease;
			}

			.progress-fill.active {
				background: var(--brand-experiment, #5865f2);
			}

			.progress-text {
				display: flex;
				justify-content: space-between;
				font-size: 12px;
				color: var(--text-muted, #96989d);
				margin-top: 4px;
			}

			/* Activity log - Terminal style */
			.activity-log {
				background: var(--background-secondary-alt, #292b2f);
				border-top: 1px solid var(--background-modifier-accent, #4f545c);
				max-height: 150px;
				overflow-y: auto;
			}

			.activity-log::-webkit-scrollbar {
				width: 8px;
			}

			.activity-log::-webkit-scrollbar-track {
				background: var(--background-secondary-alt, #292b2f);
			}

			.activity-log::-webkit-scrollbar-thumb {
				background: var(--background-tertiary, #202225);
				border-radius: 4px;
			}

			.log-header {
				padding: 8px 16px;
				background: var(--background-tertiary, #202225);
				font-size: 12px;
				font-weight: 600;
				color: var(--header-secondary, #b9bbbe);
				border-bottom: 1px solid var(--background-modifier-accent, #4f545c);
			}

			.log-content {
				padding: 8px 16px;
				font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
				font-size: 12px;
			}

			.log-entry {
				padding: 4px 0;
				display: flex;
				gap: 8px;
			}

			.log-time {
				color: var(--text-muted, #96989d);
			}

			.log-message {
				flex: 1;
			}

			.log-info { color: var(--text-link, #00aff4); }
			.log-success { color: var(--button-positive-background, #248046); }
			.log-warning { color: var(--status-warning, #f0b232); }
			.log-error { color: var(--status-danger, #f23f42); }

			/* No quests state */
			.no-quests {
				padding: 48px 24px;
				text-align: center;
			}

			.no-quests-icon {
				font-size: 48px;
				margin-bottom: 16px;
				opacity: 0.5;
			}

			.no-quests h2 {
				font-size: 18px;
				color: var(--header-primary, #fff);
				margin-bottom: 8px;
			}

			.no-quests p {
				color: var(--text-muted, #96989d);
				font-size: 14px;
			}

			/* Confirmation modal */
			.confirmation-overlay {
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: rgba(0, 0, 0, 0.85);
				z-index: 999999;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.confirmation-modal {
				background: var(--background-primary, #36393f);
				border-radius: 8px;
				padding: 24px;
				width: 440px;
				box-shadow: 0 8px 16px rgba(0, 0, 0, 0.24);
				position: relative;
				z-index: 1000000;
			}

			.confirmation-header {
				font-size: 20px;
				font-weight: 600;
				color: var(--header-primary, #fff);
				margin-bottom: 12px;
			}

			.confirmation-body {
				font-size: 14px;
				color: var(--text-normal, #dcddde);
				margin-bottom: 24px;
				line-height: 1.5;
			}

			.confirmation-footer {
				display: flex;
				gap: 12px;
				justify-content: flex-end;
			}

			@keyframes spin {
				from { transform: rotate(0deg); }
				to { transform: rotate(360deg); }
			}

			.spinning {
				animation: spin 1s linear infinite;
			}
		</style>

		<!-- Main container -->
		<div class="quest-header">
			<div class="quest-header-left">
				<div class="quest-header-title">
					<span>🎮</span>
					<span>Quest Automator</span>
					<span class="quest-header-badge">v3.0</span>
				</div>
			</div>
			<div class="quest-header-controls">
				<button class="header-btn minimize" id="minimize-btn-header" title="Minimize">
					<span id="minimize-icon">─</span>
				</button>
				<button class="header-btn close" id="close-btn-header" title="Close">×</button>
			</div>
		</div>

		<div class="quest-body">
			<!-- Control bar -->
			<div class="control-bar">
				<div class="control-bar-left">
					<button class="control-btn success" id="pause-btn" disabled>
						<span id="pause-icon">⏸</span>
						<span id="pause-text">Pause</span>
					</button>
					<div class="status-indicator">
						<span class="status-dot idle" id="status-dot"></span>
						<span id="status-text">Idle</span>
					</div>
				</div>
				<div class="control-bar-right">
					<span style="font-size: 12px; color: var(--text-muted, #96989d);" id="quest-counter">0 of 0 quests</span>
				</div>
			</div>

			<!-- Stats section -->
			<div class="stats-section">
				<div class="stats-grid">
					<div class="stat-card">
						<div class="stat-label">Total Quests</div>
						<div class="stat-value" id="total-quests">0</div>
					</div>
					<div class="stat-card">
						<div class="stat-label">Active</div>
						<div class="stat-value active" id="active-quests">0</div>
					</div>
					<div class="stat-card">
						<div class="stat-label">Completed</div>
						<div class="stat-value completed" id="completed-quests">0</div>
					</div>
				</div>
			</div>

			<!-- Quest list -->
			<div class="quest-list" id="quest-list"></div>

			<!-- Activity log -->
			<div class="activity-log">
				<div class="log-header">Activity Log</div>
				<div class="log-content" id="log-content"></div>
			</div>
		</div>
	`;

	document.body.appendChild(container);
	makeDraggable(container, container.querySelector('.quest-header'));
	
	// Add event listeners for buttons
	const minimizeBtn = document.getElementById('minimize-btn-header');
	const closeBtn = document.getElementById('close-btn-header');
	const pauseBtn = document.getElementById('pause-btn');
	
	if (minimizeBtn) {
		minimizeBtn.addEventListener('click', function(e) {
			e.stopPropagation();
			toggleMinimize();
		});
	}
	
	if (closeBtn) {
		closeBtn.addEventListener('click', function(e) {
			e.stopPropagation();
			attemptClose();
		});
	}
	
	if (pauseBtn) {
		pauseBtn.addEventListener('click', function(e) {
			e.stopPropagation();
			togglePause();
		});
	}
	
	return container;
}

// Make UI draggable
function makeDraggable(element, handle) {
	let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	let isDragging = false;
	
	handle.onmousedown = dragMouseDown;

	function dragMouseDown(e) {
		// Don't drag if clicking on buttons or interactive elements
		if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
			return;
		}
		
		e.preventDefault();
		isDragging = false;
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		document.onmousemove = elementDrag;
	}

	function elementDrag(e) {
		e.preventDefault();
		isDragging = true;
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		element.style.top = (element.offsetTop - pos2) + "px";
		element.style.left = (element.offsetLeft - pos1) + "px";
		element.style.transform = 'none';
	}

	function closeDragElement() {
		document.onmouseup = null;
		document.onmousemove = null;
		isDragging = false;
	}
}

// UI Control functions
window.toggleMinimize = function() {
	const ui = document.getElementById('quest-automator-ui');
	const icon = document.getElementById('minimize-icon');
	ui.classList.toggle('minimized');
	icon.textContent = ui.classList.contains('minimized') ? '+' : '─';
};

window.attemptClose = function() {
	const remaining = AutomatorState.totalQuests - AutomatorState.completedQuests;
	
	if (remaining > 0 && AutomatorState.isRunning) {
		showConfirmation(
			'Close Quest Automator?',
			`You still have ${remaining} quest${remaining > 1 ? 's' : ''} remaining. Are you sure you want to close the automator?`,
			() => {
				closeUI();
			}
		);
	} else {
		closeUI();
	}
};

function closeUI() {
	const ui = document.getElementById('quest-automator-ui');
	if (ui) ui.remove();
}

window.togglePause = function() {
	AutomatorState.isPaused = !AutomatorState.isPaused;
	
	const pauseBtn = document.getElementById('pause-btn');
	const pauseIcon = document.getElementById('pause-icon');
	const pauseText = document.getElementById('pause-text');
	const statusDot = document.getElementById('status-dot');
	const statusText = document.getElementById('status-text');
	
	if (AutomatorState.isPaused) {
		pauseBtn.className = 'control-btn primary';
		pauseIcon.textContent = '▶';
		pauseText.textContent = 'Resume';
		statusDot.className = 'status-dot paused';
		statusText.textContent = 'Paused';
		addLog('⏸ Automation paused', 'warning');
	} else {
		pauseBtn.className = 'control-btn success';
		pauseIcon.textContent = '⏸';
		pauseText.textContent = 'Pause';
		statusDot.className = 'status-dot';
		statusText.textContent = 'Running';
		addLog('▶ Automation resumed', 'success');
	}
};

// Confirmation modal
function showConfirmation(title, message, onConfirm) {
	const overlay = document.createElement('div');
	overlay.className = 'confirmation-overlay';
	overlay.innerHTML = `
		<div class="confirmation-modal">
			<div class="confirmation-header">${title}</div>
			<div class="confirmation-body">${message}</div>
			<div class="confirmation-footer">
				<button class="control-btn" id="confirm-cancel-btn">Cancel</button>
				<button class="control-btn danger" id="confirm-close-btn">Close Automator</button>
			</div>
		</div>
	`;
	document.body.appendChild(overlay);
	
	// Add event listeners
	const cancelBtn = overlay.querySelector('#confirm-cancel-btn');
	const confirmBtn = overlay.querySelector('#confirm-close-btn');
	
	if (cancelBtn) {
		cancelBtn.addEventListener('click', function() {
			overlay.remove();
		});
	}
	
	if (confirmBtn) {
		confirmBtn.addEventListener('click', function() {
			overlay.remove();
			onConfirm();
		});
	}
}

// Logging
function addLog(message, type = 'info') {
	const logContent = document.getElementById('log-content');
	if (!logContent) return;
	
	const entry = document.createElement('div');
	entry.className = 'log-entry';
	entry.innerHTML = `
		<span class="log-time">${new Date().toLocaleTimeString()}</span>
		<span class="log-message log-${type}">${message}</span>
	`;
	logContent.appendChild(entry);
	logContent.parentElement.scrollTop = logContent.parentElement.scrollHeight;

	console.log(`%c${message}`, `color: ${
		type === 'success' ? '#248046' :
		type === 'error' ? '#f23f42' :
		type === 'warning' ? '#f0b232' :
		'#00aff4'
	}`);
}

// Update quest display
function updateQuestDisplay(quests, activeQuestId = null) {
	const questList = document.getElementById('quest-list');
	if (!questList) return;

	if (quests.length === 0) {
		questList.innerHTML = `
			<div class="no-quests">
				<div class="no-quests-icon">✨</div>
				<h2>No Active Quests</h2>
				<p>You don't have any uncompleted quests at the moment!</p>
			</div>
		`;
		return;
	}

	questList.innerHTML = quests.map((quest, index) => {
		const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
		const taskName = supportedTasks.find(x => taskConfig.tasks[x] != null);
		const emoji = taskEmojis[taskName] || "⚡";
		const secondsNeeded = taskConfig.tasks[taskName].target;
		const secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
		const progressPercent = Math.floor((secondsDone / secondsNeeded) * 100);
		const timeLeft = Math.ceil((secondsNeeded - secondsDone) / 60);
		
		const isActive = quest.id === activeQuestId;
		const isCompleted = quest.userStatus?.completedAt;
		
		let statusClass = 'pending';
		let statusText = 'Pending';
		let itemClass = 'quest-item';
		
		if (isCompleted) {
			statusClass = 'completed';
			statusText = 'Completed';
			itemClass += ' completed';
		} else if (isActive) {
			statusClass = 'active';
			statusText = 'Active';
			itemClass += ' active';
		}

		return `
			<div class="${itemClass}" id="quest-${quest.id}">
				<div class="quest-header-row">
					<div class="quest-title-section">
						<span class="quest-icon">${emoji}</span>
						<span class="quest-name">${quest.config.messages.questName}</span>
					</div>
					<span class="quest-status-badge ${statusClass}">${statusText}</span>
				</div>
				<div class="quest-meta">
					🎮 ${quest.config.application.name}
					<span class="quest-type-tag">${taskName.replace(/_/g, ' ')}</span>
				</div>
				<div class="progress-container">
					<div class="progress-bar">
						<div class="progress-fill ${isActive ? 'active' : ''}" style="width: ${progressPercent}%"></div>
					</div>
					<div class="progress-text">
						<span>${progressPercent}% complete (${secondsDone}/${secondsNeeded}s)</span>
						<span>${timeLeft} min remaining</span>
					</div>
				</div>
			</div>
		`;
	}).join('');
}

// Update stats
function updateStats(total, active, completed) {
	const totalEl = document.getElementById('total-quests');
	const activeEl = document.getElementById('active-quests');
	const completedEl = document.getElementById('completed-quests');
	const counterEl = document.getElementById('quest-counter');
	
	if (totalEl) totalEl.textContent = total;
	if (activeEl) activeEl.textContent = active;
	if (completedEl) completedEl.textContent = completed;
	if (counterEl) counterEl.textContent = `${completed} of ${total} quests`;
}

// Update quest progress
function updateQuestProgress(questId, progress, total) {
	const questEl = document.getElementById(`quest-${questId}`);
	if (!questEl) return;

	const progressPercent = Math.floor((progress / total) * 100);
	const timeLeft = Math.ceil((total - progress) / 60);

	const progressFill = questEl.querySelector('.progress-fill');
	const progressText = questEl.querySelector('.progress-text');

	if (progressFill) {
		progressFill.style.width = `${progressPercent}%`;
	}

	if (progressText) {
		progressText.innerHTML = `
			<span>${progressPercent}% complete (${progress}/${total}s)</span>
			<span>${timeLeft} min remaining</span>
		`;
	}
}

// Update status
function setStatus(status, text) {
	const statusDot = document.getElementById('status-dot');
	const statusText = document.getElementById('status-text');
	const pauseBtn = document.getElementById('pause-btn');
	
	if (statusDot) {
		statusDot.className = `status-dot ${status}`;
	}
	if (statusText) {
		statusText.textContent = text;
	}
	if (pauseBtn) {
		pauseBtn.disabled = status === 'idle';
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN AUTOMATION LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

createQuestUI();
addLog('🚀 Quest Automator initialized', 'info');

// Initialize Discord internals
addLog('Connecting to Discord...', 'info');

delete window.$;
let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
webpackChunkdiscord_app.pop();

let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.Z;
let RunningGameStore, QuestsStore, ChannelStore, GuildChannelStore, FluxDispatcher, api;

if(!ApplicationStreamingStore) {
	ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getStreamerActiveStreamMetadata).exports.A;
	RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getRunningGames).exports.Ay;
	QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getQuest).exports.A;
	ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getAllThreadsForParent).exports.A;
	GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getSFWDefaultChannel).exports.Ay;
	FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.h?.__proto__?.flushWaitQueue).exports.h;
	api = Object.values(wpRequire.c).find(x => x?.exports?.Bo?.get).exports.Bo;
} else {
	RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getRunningGames).exports.ZP;
	QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest).exports.Z;
	ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getAllThreadsForParent).exports.Z;
	GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getSFWDefaultChannel).exports.ZP;
	FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.flushWaitQueue).exports.Z;
	api = Object.values(wpRequire.c).find(x => x?.exports?.tn?.get).exports.tn;	
}

addLog('✓ Connected successfully', 'success');

const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];
const taskEmojis = {
	"WATCH_VIDEO": "📺",
	"WATCH_VIDEO_ON_MOBILE": "📱",
	"PLAY_ON_DESKTOP": "🎮",
	"STREAM_ON_DESKTOP": "📡",
	"PLAY_ACTIVITY": "🎯"
};

addLog('Scanning for active quests...', 'info');

let quests = [...QuestsStore.quests.values()].filter(x => 
	x.userStatus?.enrolledAt && 
	!x.userStatus?.completedAt && 
	new Date(x.config.expiresAt).getTime() > Date.now() && 
	supportedTasks.find(y => Object.keys((x.config.taskConfig ?? x.config.taskConfigV2).tasks).includes(y))
);

let isApp = typeof DiscordNative !== "undefined";

AutomatorState.totalQuests = quests.length;
AutomatorState.completedQuests = 0;

updateStats(AutomatorState.totalQuests, AutomatorState.totalQuests, 0);
updateQuestDisplay(quests);

if (quests.length === 0) {
	addLog('No active quests found', 'warning');
	setStatus('idle', 'Idle');
} else {
	addLog(`Found ${AutomatorState.totalQuests} quest(s)`, 'success');
	addLog('Starting automation...', 'info');
	AutomatorState.isRunning = true;
	setStatus('', 'Running');

	let doJob = function() {
		// Check if paused
		if (AutomatorState.isPaused) {
			setTimeout(doJob, 1000);
			return;
		}

		const quest = quests.pop();
		if(!quest) {
			addLog(`🎉 All quests completed!`, 'success');
			updateStats(AutomatorState.totalQuests, 0, AutomatorState.completedQuests);
			setStatus('idle', 'Complete');
			AutomatorState.isRunning = false;
			return;
		}

		const pid = Math.floor(Math.random() * 30000) + 1000;
		
		const applicationId = quest.config.application.id;
		const applicationName = quest.config.application.name;
		const questName = quest.config.messages.questName;
		const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
		const taskName = supportedTasks.find(x => taskConfig.tasks[x] != null);
		const secondsNeeded = taskConfig.tasks[taskName].target;
		let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;

		AutomatorState.completedQuests++;
		AutomatorState.activeQuestId = quest.id;
		updateStats(AutomatorState.totalQuests, AutomatorState.totalQuests - AutomatorState.completedQuests, AutomatorState.completedQuests);
		updateQuestDisplay([quest, ...quests], quest.id);

		addLog(`▶ Processing: ${questName}`, 'info');

		if(taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
			addLog(`📺 Video quest detected`, 'info');
			
			const maxFuture = 10, speed = 7, interval = 1;
			const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime();
			let completed = false;
			
			let fn = async () => {			
				while(true) {
					if (AutomatorState.isPaused) {
						await new Promise(resolve => setTimeout(resolve, 1000));
						continue;
					}

					const maxAllowed = Math.floor((Date.now() - enrolledAt)/1000) + maxFuture;
					const diff = maxAllowed - secondsDone;
					const timestamp = secondsDone + speed;
					
					if(diff >= speed) {
						const res = await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: Math.min(secondsNeeded, timestamp + Math.random())}});
						completed = res.body.completed_at != null;
						secondsDone = Math.min(secondsNeeded, timestamp);
						
						updateQuestProgress(quest.id, secondsDone, secondsNeeded);
					}
					
					if(timestamp >= secondsNeeded) {
						break;
					}
					await new Promise(resolve => setTimeout(resolve, interval * 1000));
				}
				
				if(!completed) {
					await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: secondsNeeded}});
				}
				
				quest.userStatus.completedAt = new Date();
				addLog(`✅ "${questName}" completed`, 'success');
				updateQuestDisplay([quest, ...quests]);
				setTimeout(doJob, 1000);
			};
			fn();
			
		} else if(taskName === "PLAY_ON_DESKTOP") {
			if(!isApp) {
				addLog('❌ Browser not supported for this quest', 'error');
				addLog('Use Discord Desktop App', 'warning');
				setTimeout(doJob, 1000);
			} else {
				addLog(`🎮 Desktop game quest detected`, 'info');
				
				api.get({url: `/applications/public?application_ids=${applicationId}`}).then(res => {
					const appData = res.body[0];
					const exeName = appData.executables.find(x => x.os === "win32").name.replace(">","");
					
					const fakeGame = {
						cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
						exeName,
						exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
						hidden: false,
						isLauncher: false,
						id: applicationId,
						name: appData.name,
						pid: pid,
						pidPath: [pid],
						processName: appData.name,
						start: Date.now(),
					};
					
					const realGames = RunningGameStore.getRunningGames();
					const fakeGames = [fakeGame];
					const realGetRunningGames = RunningGameStore.getRunningGames;
					const realGetGameForPID = RunningGameStore.getGameForPID;
					
					RunningGameStore.getRunningGames = () => fakeGames;
					RunningGameStore.getGameForPID = (pid) => fakeGames.find(x => x.pid === pid);
					FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames});
					
					addLog(`✓ Spoofed ${applicationName}`, 'success');
					
					let fn = data => {
						if (AutomatorState.isPaused) return;

						let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
						updateQuestProgress(quest.id, progress, secondsNeeded);
						
						if(progress >= secondsNeeded) {
							quest.userStatus.completedAt = new Date();
							addLog(`✅ "${questName}" completed`, 'success');
							
							RunningGameStore.getRunningGames = realGetRunningGames;
							RunningGameStore.getGameForPID = realGetGameForPID;
							FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: []});
							FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
							
							updateQuestDisplay([quest, ...quests]);
							setTimeout(doJob, 1000);
						}
					};
					FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
				});
			}
			
		} else if(taskName === "STREAM_ON_DESKTOP") {
			if(!isApp) {
				addLog('❌ Browser not supported for this quest', 'error');
				addLog('Use Discord Desktop App', 'warning');
				setTimeout(doJob, 1000);
			} else {
				addLog(`📡 Stream quest detected`, 'info');
				addLog('⚠ Need 1+ person in VC', 'warning');
				
				let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
				ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
					id: applicationId,
					pid,
					sourceName: null
				});
				
				addLog(`✓ Spoofed stream metadata`, 'success');
				
				let fn = data => {
					if (AutomatorState.isPaused) return;

					let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
					updateQuestProgress(quest.id, progress, secondsNeeded);
					
					if(progress >= secondsNeeded) {
						quest.userStatus.completedAt = new Date();
						addLog(`✅ "${questName}" completed`, 'success');
						
						ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
						FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
						
						updateQuestDisplay([quest, ...quests]);
						setTimeout(doJob, 1000);
					}
				};
				FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
			}
			
		} else if(taskName === "PLAY_ACTIVITY") {
			addLog(`🎯 Activity quest detected`, 'info');
			
			const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0).VOCAL[0].channel.id;
			const streamKey = `call:${channelId}:1`;
			
			let fn = async () => {
				while(true) {
					if (AutomatorState.isPaused) {
						await new Promise(resolve => setTimeout(resolve, 1000));
						continue;
					}

					const res = await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}});
					const progress = res.body.progress.PLAY_ACTIVITY.value;
					updateQuestProgress(quest.id, progress, secondsNeeded);
					
					await new Promise(resolve => setTimeout(resolve, 20 * 1000));
					
					if(progress >= secondsNeeded) {
						await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: true}});
						break;
					}
				}
				
				quest.userStatus.completedAt = new Date();
				addLog(`✅ "${questName}" completed`, 'success');
				updateQuestDisplay([quest, ...quests]);
				setTimeout(doJob, 1000);
			};
			fn();
		}
	};
	
	doJob();
}