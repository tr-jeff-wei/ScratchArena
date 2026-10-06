(function () {
    const MAX_WAIT_MS = 10000;
    const RETRY_INTERVAL_MS = 200;
    const startedAt = Date.now();
    let greenFlagStartTime = null;
    let attempts = 0;
    let playerPreX = null;
    let playerPreY = null;

    function findVm() {
        const reactRoot = document.getElementById('app');
        if (!reactRoot) {
            if (Date.now() - startedAt < MAX_WAIT_MS) {
                attempts += 1;
                setTimeout(findVm, RETRY_INTERVAL_MS);
                return;
            }

            console.error("❌ 找不到 id 為 'app' 的元素，請確認您是在 Scratch 編輯器專案畫面中。");
            return;
        }

        let vm = null;

        const containerKey = Object.keys(reactRoot).find(key => key.startsWith('__reactContainer'));
        console.log("containerKey => ", containerKey);
        if (containerKey) {
            let current = reactRoot[containerKey];
            console.log("current => ", current);
            while (current) {
                if (current.memoizedProps?.store || current.pendingProps?.store) {
                    const store = current.memoizedProps?.store || current.pendingProps?.store;
                    console.log("store => ", store);
                    window.__scratchArenaStore = store;
                    vm = store.getState().scratchGui?.vm;
                    if (vm) break;
                }
                current = current.child;
            }
        }

        // console.log("vm => ", vm);
        if (vm) {
            window.vm = vm;
            console.log("✅ 成功獲取 Scratch VM！現在您可以使用 window.vm 來查詢角色了。");
            console.log("快速測試：請輸入 `console.table(window.vm.runtime.targets.map(t => t.sprite.name))` 來查看所有角色。");

            const overlayId = 'scratch-arena-info';
            const styleId = 'scratch-arena-info-style';

            function ensurePanelVisibilityButton(overlay) {
                const buttonId = `${overlayId}-visibility-toggle`;
                const existingButton = document.getElementById(buttonId);
                if (existingButton) return existingButton;

                const stageSizeRow = document.querySelector('[class*="stage-size-row"]');
                const nativeButton = stageSizeRow?.querySelector('button[aria-label*="full screen" i], button[title*="full screen" i], button[class*="stage-button"]');
                const toolbar = stageSizeRow?.parentElement;
                if (!nativeButton || !toolbar) return null;

                const button = nativeButton.cloneNode(false);
                button.id = buttonId;
                button.type = 'button';
                const panelVisible = !overlay.hidden;
                const label = panelVisible ? '隱藏' : '顯示';
                button.setAttribute('aria-label', `${label} Scratch Arena 評估面板`);
                button.setAttribute('aria-pressed', String(panelVisible));
                button.title = `${label} Scratch Arena 評估面板`;
                const buttonLabel = document.createElement('span');
                buttonLabel.textContent = 'Scratch Arena';

                const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                icon.setAttribute('viewBox', '0 0 20 20');
                icon.setAttribute('width', '18');
                icon.setAttribute('height', '18');
                icon.setAttribute('fill', 'none');
                icon.setAttribute('stroke', 'currentColor');
                icon.setAttribute('stroke-width', '1.5');
                icon.setAttribute('stroke-linecap', 'round');
                icon.setAttribute('stroke-linejoin', 'round');
                icon.setAttribute('aria-hidden', 'true');
                const frame = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                frame.setAttribute('x', '2.75');
                frame.setAttribute('y', '3.5');
                frame.setAttribute('width', '14.5');
                frame.setAttribute('height', '13');
                frame.setAttribute('rx', '1.5');
                const divider = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                divider.setAttribute('d', 'M8 4v12');
                icon.append(frame, divider);
                button.append(icon, buttonLabel);

                button.addEventListener('click', () => {
                    const visible = overlay.hidden;
                    overlay.hidden = !visible;
                    button.setAttribute('aria-pressed', String(visible));
                    const label = visible ? '隱藏' : '顯示';
                    button.setAttribute('aria-label', `${label} Scratch Arena 評估面板`);
                    button.title = `${label} Scratch Arena 評估面板`;
                });

                toolbar.insertBefore(button, stageSizeRow);
                return button;
            }

            function ensureOverlay() {
                let overlay = document.getElementById(overlayId);
                if (overlay) {
                    ensurePanelVisibilityButton(overlay);
                    return overlay;
                }

                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = `
                    #${overlayId}-visibility-toggle {
                        display: inline-flex;
                        width: auto !important;
                        min-width: 132px;
                        align-items: center;
                        justify-content: center;
                        gap: 7px;
                        padding: 0 10px !important;
                        color: #fff !important;
                        background: #f28c18 !important;
                        border-color: #db7608 !important;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: 700;
                        white-space: nowrap;
                    }
                    #${overlayId}-visibility-toggle:hover {
                        background: #df7400 !important;
                    }
                    #${overlayId}-visibility-toggle:focus-visible {
                        outline: 2px solid #4c97ff;
                        outline-offset: 2px;
                    }
                    #${overlayId}-visibility-toggle svg {
                        flex: 0 0 18px;
                    }
                    #${overlayId} {
                        position: fixed;
                        top: 53px;
                        right: 510px;
                        z-index: 2147483647;
                        min-width: 260px;
                        max-width: 360px;
                        color: #f8f8f2;
                        background: rgba(16, 18, 20, 0.88);
                        border: 1px solid rgba(255,255,255,0.12);
                        border-radius: 14px;
                        padding: 12px 14px;
                        box-shadow: 0 18px 40px rgba(0,0,0,0.35);
                        backdrop-filter: blur(10px);
                        font: 12px/1.5 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }
                    #${overlayId} .panel-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 10px;
                        margin-bottom: 10px;
                    }
                    #${overlayId} h4 {
                        margin: 0;
                        font-size: 13px;
                        letter-spacing: 0.03em;
                        color: #a7d2ff;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    #${overlayId} .field {
                        margin: 4px 0;
                    }
                    #${overlayId} .label {
                        color: #8fd3ff;
                    }
                    #${overlayId} .value {
                        color: #f8f8f2;
                        font-weight: 600;
                    }
                    #${overlayId} .warning {
                        display: inline-block;
                        margin-left: 4px;
                        padding: 2px 8px;
                        color: #ffdda4;
                        background: rgba(255, 189, 105, 0.18);
                        border: 1px solid rgba(255, 189, 105, 0.35);
                        border-radius: 999px;
                        font-weight: 700;
                        font-size: 11px;
                    }
                    #${overlayId} .status-pill {
                        display: inline-block;
                        margin-left: 6px;
                        padding: 2px 10px;
                        border-radius: 999px;
                        font-weight: 700;
                        font-size: 11px;
                        letter-spacing: 0.02em;
                    }
                    #${overlayId} .status-pill.running,
                    #${overlayId} .status-pill.pass {
                        color: #9ef2c1;
                        background: rgba(38, 161, 105, 0.16);
                        border: 1px solid rgba(38, 161, 105, 0.28);
                    }
                    #${overlayId} .status-pill.stopped,
                    #${overlayId} .status-pill.fail {
                        color: #ffb7b8;
                        background: rgba(198, 73, 88, 0.16);
                        border: 1px solid rgba(198, 73, 88, 0.28);
                    }
                    #${overlayId} .status-pill.unknown {
                        color: #ffd56e;
                        background: rgba(255, 182, 74, 0.16);
                        border: 1px solid rgba(255, 182, 74, 0.28);
                    }
                    #${overlayId} .workflow-box {
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 1px solid rgba(255,255,255,0.12);
                    }
                    #${overlayId} .workflow-title {
                        margin: 0 0 8px;
                        font-size: 11px;
                        color: #9eafb2;
                        letter-spacing: 0.08em;
                    }
                    #${overlayId} .workflow-guidance {
                        margin: 0 0 8px;
                        padding: 8px 9px;
                        color: #ffe3e3;
                        background: rgba(198, 73, 88, 0.2);
                        border: 1px solid rgba(255, 140, 148, 0.38);
                        border-left: 3px solid #ff8c94;
                        border-radius: 3px;
                        font-size: 11px;
                        font-weight: 700;
                        line-height: 1.45;
                    }
                    #${overlayId} .workflow-list {
                        display: grid;
                        gap: 6px;
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }
                    #${overlayId} .workflow-group {
                        min-width: 0;
                        overflow: hidden;
                        background: rgba(17, 27, 34, 0.82);
                        border: 1px solid rgba(130, 163, 166, 0.18);
                        transition: border-color 0.22s ease, background 0.22s ease, box-shadow 0.22s ease;
                    }
                    #${overlayId} .workflow-group.expanded {
                        background: linear-gradient(145deg, rgba(24, 39, 44, 0.95), rgba(14, 22, 29, 0.96));
                        border-color: rgba(124, 242, 167, 0.45);
                        box-shadow: inset 2px 0 rgba(124, 242, 167, 0.9), 0 0 18px rgba(65, 184, 139, 0.07);
                        animation: workflowPhasePulse 0.62s ease-out;
                    }
                    @keyframes workflowPhasePulse {
                        0% { box-shadow: inset 2px 0 rgba(124, 242, 167, 0.9), 0 0 0 rgba(65, 184, 139, 0); }
                        45% { box-shadow: inset 3px 0 #7cf2a7, 0 0 24px rgba(65, 184, 139, 0.28); }
                        100% { box-shadow: inset 2px 0 rgba(124, 242, 167, 0.9), 0 0 18px rgba(65, 184, 139, 0.07); }
                    }
                    #${overlayId} .workflow-stage-toggle {
                        display: grid;
                        width: 100%;
                        min-width: 0;
                        grid-template-columns: 25px minmax(0, 1fr) 12px;
                        align-items: center;
                        gap: 8px;
                        padding: 8px 9px;
                        color: #e7efeb;
                        text-align: left;
                        background: transparent;
                        border: 0;
                        cursor: pointer;
                        font: inherit;
                    }
                    #${overlayId} .workflow-stage-toggle:focus-visible {
                        outline: 2px solid #7cf2a7;
                        outline-offset: -2px;
                    }
                    #${overlayId} .workflow-icon {
                        display: grid;
                        width: 23px;
                        height: 23px;
                        flex-shrink: 0;
                        place-items: center;
                        color: #f9d56e;
                        background: rgba(249, 213, 110, 0.08);
                        border: 1px solid rgba(249, 213, 110, 0.2);
                        border-radius: 50%;
                        font-size: 11px;
                        line-height: 1;
                    }
                    #${overlayId} .workflow-group.pass .workflow-icon {
                        color: #7cf2a7;
                        background: rgba(124, 242, 167, 0.1);
                        border-color: rgba(124, 242, 167, 0.3);
                    }
                    #${overlayId} .workflow-group.fail .workflow-icon {
                        color: #ff8c94;
                        background: rgba(255, 140, 148, 0.1);
                        border-color: rgba(255, 140, 148, 0.28);
                    }
                    #${overlayId} .workflow-stage-copy {
                        display: flex;
                        min-width: 0;
                        align-items: center;
                        justify-content: space-between;
                        gap: 5px;
                    }
                    #${overlayId} .workflow-stage-name {
                        min-width: 0;
                        overflow-wrap: anywhere;
                        font-size: 11px;
                        font-weight: 700;
                        line-height: 1.35;
                    }
                    #${overlayId} .workflow-stage-status {
                        flex-shrink: 0;
                        color: #9aaeb0;
                        font-size: 9px;
                        white-space: nowrap;
                    }
                    #${overlayId} .workflow-group.pass .workflow-stage-status { color: #7cf2a7; }
                    #${overlayId} .workflow-group.fail .workflow-stage-status { color: #ff8c94; }
                    #${overlayId} .workflow-chevron {
                        width: 7px;
                        height: 7px;
                        border-right: 1px solid #82969a;
                        border-bottom: 1px solid #82969a;
                        transform: rotate(45deg) translate(-1px, -1px);
                        transition: transform 0.24s ease, border-color 0.2s ease;
                    }
                    #${overlayId} .workflow-group.expanded .workflow-chevron {
                        border-color: #7cf2a7;
                        transform: rotate(225deg) translate(-1px, -1px);
                    }
                    #${overlayId} .workflow-details {
                        display: grid;
                        grid-template-rows: 0fr;
                        opacity: 0;
                        transition: grid-template-rows 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
                    }
                    #${overlayId} .workflow-group.expanded .workflow-details {
                        grid-template-rows: 1fr;
                        opacity: 1;
                    }
                    #${overlayId} .workflow-details-inner {
                        min-height: 0;
                        overflow: hidden;
                        transform: translateY(-12px);
                        filter: blur(2px);
                        transition: transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease;
                    }
                    #${overlayId} .workflow-group.expanded .workflow-details-inner {
                        transform: translateY(0);
                        filter: blur(0);
                    }
                    #${overlayId} .workflow-sublist {
                        display: grid;
                        gap: 3px;
                        list-style: none;
                        padding: 2px 8px 8px 11px;
                        margin: 0 8px 8px 20px;
                        border-left: 1px solid rgba(130, 163, 166, 0.26);
                    }
                    #${overlayId} .workflow-step {
                        display: flex;
                        align-items: flex-start;
                        gap: 8px;
                        min-width: 0;
                        margin: 0;
                        color: #d7d7e0;
                        font-size: 10px;
                        line-height: 1.4;
                    }
                    #${overlayId} .workflow-step small {
                        display: block;
                        margin-top: 2px;
                        color: #9aaeb0;
                        overflow-wrap: anywhere;
                    }
                    #${overlayId} .workflow-step .workflow-icon {
                        width: 18px;
                        height: 18px;
                        flex: 0 0 18px;
                        border-radius: 50%;
                        text-align: center;
                        font-size: 12px;
                        line-height: 1;
                    }
                    #${overlayId} .workflow-step.pass .workflow-icon {
                        color: #7cf2a7;
                    }
                    #${overlayId} .workflow-step.fail .workflow-icon {
                        color: #ff8c94;
                    }
                    #${overlayId} .workflow-step.unknown .workflow-icon,
                    #${overlayId} .workflow-step.locked .workflow-icon,
                    #${overlayId} .workflow-step.active .workflow-icon {
                        color: #f9d56e;
                    }
                    #${overlayId} .workflow-step.locked {
                        opacity: 0.6;
                    }
                    #${overlayId} .workflow-step.active {
                        border-left: 2px solid rgba(124, 242, 167, 0.95);
                        padding-left: 6px;
                        background: rgba(124, 242, 167, 0.06);
                    }
                    #${overlayId} .workflow-group.expanded .workflow-step {
                        animation: workflowStepEnter 0.34s cubic-bezier(0.16, 1, 0.3, 1) both;
                    }
                    #${overlayId} .workflow-group.expanded .workflow-step:nth-child(2) { animation-delay: 0.06s; }
                    #${overlayId} .workflow-group.expanded .workflow-step:nth-child(3) { animation-delay: 0.12s; }
                    #${overlayId} .workflow-group.expanded .workflow-step:nth-child(4) { animation-delay: 0.18s; }
                    @keyframes workflowStepEnter {
                        from { opacity: 0; transform: translateX(-8px); }
                        to { opacity: 1; transform: translateX(0); }
                    }
                    @media (prefers-reduced-motion: reduce) {
                        #${overlayId} *,
                        #${overlayId} *::before,
                        #${overlayId} *::after {
                            animation-duration: 0.01ms !important;
                            animation-iteration-count: 1 !important;
                            transition-duration: 0.01ms !important;
                        }
                    }
                    #${overlayId} .workflow-button-wrap {
                        position: relative;
                        width: 100%;
                        box-sizing: border-box;
                        margin: 10px 0 12px;
                        padding: 9px;
                        overflow: hidden;
                        border: 1px solid rgba(124, 242, 167, 0.24);
                        border-radius: 9px;
                        background: rgba(17, 27, 34, 0.72);
                        transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
                    }
                    #${overlayId} .workflow-button-wrap.attention {
                        border-color: rgba(255, 190, 91, 0.82);
                        background: linear-gradient(135deg, rgba(104, 61, 19, 0.55), rgba(33, 28, 21, 0.92));
                        box-shadow: 0 0 0 1px rgba(255, 190, 91, 0.16), 0 0 20px rgba(255, 170, 55, 0.2);
                        animation: workflowPromptGlow 1.6s ease-in-out infinite;
                    }
                    #${overlayId} .workflow-button-wrap.attention::before {
                        position: absolute;
                        top: 0;
                        bottom: 0;
                        left: -45%;
                        width: 35%;
                        background: linear-gradient(90deg, transparent, rgba(255, 230, 176, 0.16), transparent);
                        content: '';
                        pointer-events: none;
                        animation: workflowPromptSweep 2.8s ease-in-out infinite;
                    }
                    #${overlayId} .workflow-button-wrap.counting {
                        border-color: rgba(124, 242, 167, 0.58);
                        box-shadow: 0 0 16px rgba(65, 184, 139, 0.14);
                    }
                    @keyframes workflowPromptGlow {
                        0%, 100% { box-shadow: 0 0 0 1px rgba(255, 190, 91, 0.12), 0 0 12px rgba(255, 170, 55, 0.12); }
                        50% { box-shadow: 0 0 0 2px rgba(255, 190, 91, 0.32), 0 0 25px rgba(255, 170, 55, 0.34); }
                    }
                    @keyframes workflowPromptSweep {
                        0%, 35% { left: -45%; }
                        75%, 100% { left: 115%; }
                    }
                    #${overlayId} .workflow-status {
                        position: relative;
                        width: 100%;
                        max-width: 100%;
                        min-width: 0;
                        box-sizing: border-box;
                        margin: 0;
                        padding: 13px 14px;
                        background: linear-gradient(135deg, rgba(90, 201, 125, 0.16), rgba(17, 27, 34, 0.85));
                        border: 1px solid rgba(124, 242, 167, 0.3);
                        border-radius: 6px;
                        color: #dcebe2;
                        font-weight: 700;
                        font-size: 13px;
                        line-height: 1.55;
                        text-align: center;
                    }
                    #${overlayId} .workflow-button-wrap.attention .workflow-status {
                        padding: 15px 14px;
                        color: #fff0ce;
                        background:
                            linear-gradient(105deg, transparent 20%, rgba(255, 218, 153, 0.18) 50%, transparent 80%),
                            linear-gradient(135deg, rgba(111, 66, 20, 0.5), rgba(34, 29, 22, 0.96));
                        background-size: 220% 100%, 100% 100%;
                        border-color: rgba(255, 190, 91, 0.5);
                        font-size: 14px;
                        animation: workflowPromptShine 2.8s ease-in-out infinite;
                    }
                    #${overlayId} .workflow-button-wrap.counting .workflow-status {
                        padding: 13px 14px;
                    }
                    @keyframes workflowPromptShine {
                        from { background-position: -120% 0, 0 0; }
                        to { background-position: 120% 0, 0 0; }
                    }
                    #${overlayId} .workflow-status.counting {
                        background-image:
                            linear-gradient(105deg, transparent 28%, rgba(124, 242, 167, 0.32) 48%, transparent 68%),
                            linear-gradient(135deg, rgba(90, 201, 125, 0.16), rgba(17, 27, 34, 0.85));
                        background-size: 220% 100%, 100% 100%;
                        animation: workflowLightFlow 1.35s linear infinite, workflowCountdownPulse 1.8s ease-in-out infinite;
                    }
                    @keyframes workflowLightFlow {
                        from { background-position: -120% 0, 0 0; }
                        to { background-position: 120% 0, 0 0; }
                    }
                    @keyframes workflowCountdownPulse {
                        0%, 100% { border-color: rgba(124, 242, 167, 0.3); box-shadow: 0 0 0 rgba(124, 242, 167, 0); }
                        50% { border-color: rgba(124, 242, 167, 0.8); box-shadow: 0 0 13px rgba(124, 242, 167, 0.2); }
                    }
                    .keyboard-warning-dialog {
                        width: min(380px, calc(100vw - 40px));
                        box-sizing: border-box;
                        padding: 24px;
                        color: #f8f8f2;
                        background: linear-gradient(145deg, #20292c, #111719);
                        border: 1px solid rgba(255, 140, 148, 0.42);
                        border-radius: 16px;
                        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55), 0 0 36px rgba(255, 100, 110, 0.12);
                        font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        animation: keyboardWarningEnter 0.2s ease-out;
                    }
                    .keyboard-warning-dialog::backdrop {
                        background: rgba(5, 10, 12, 0.68);
                        backdrop-filter: blur(4px);
                    }
                    .keyboard-warning-header {
                        display: flex;
                        align-items: center;
                        gap: 13px;
                    }
                    .keyboard-warning-icon {
                        display: grid;
                        width: 42px;
                        height: 42px;
                        flex: 0 0 42px;
                        place-items: center;
                        color: #ff9ca3;
                        background: rgba(255, 140, 148, 0.12);
                        border: 1px solid rgba(255, 140, 148, 0.32);
                        border-radius: 13px;
                        font-size: 23px;
                        font-weight: 800;
                    }
                    .keyboard-warning-eyebrow {
                        margin: 0 0 2px;
                        color: #ff9ca3;
                        font-size: 11px;
                        font-weight: 700;
                        letter-spacing: 0.1em;
                    }
                    .keyboard-warning-title {
                        margin: 0;
                        font-size: 19px;
                        line-height: 1.3;
                    }
                    .keyboard-warning-message {
                        margin: 20px 0;
                        padding: 12px 14px;
                        color: #ffe3e3;
                        background: rgba(198, 73, 88, 0.13);
                        border-left: 3px solid #ff8c94;
                        border-radius: 5px;
                        font-size: 14px;
                    }
                    .keyboard-warning-button {
                        display: block;
                        width: 100%;
                        padding: 10px 16px;
                        color: #1a1717;
                        background: #ff9ca3;
                        border: 0;
                        border-radius: 8px;
                        cursor: pointer;
                        font: inherit;
                        font-weight: 750;
                        transition: background 0.15s ease, transform 0.15s ease;
                    }
                    .keyboard-warning-button:hover {
                        background: #ffb2b7;
                        transform: translateY(-1px);
                    }
                    .keyboard-warning-button:focus-visible {
                        outline: 2px solid #fff;
                        outline-offset: 3px;
                    }
                    @keyframes keyboardWarningEnter {
                        from { opacity: 0; transform: translateY(8px) scale(0.98); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @media (prefers-reduced-motion: reduce) {
                        .keyboard-warning-dialog,
                        .keyboard-warning-button {
                            animation-duration: 0.01ms;
                            transition-duration: 0.01ms;
                        }
                    }
                `;
                document.head.appendChild(style);

                overlay = document.createElement('div');
                overlay.id = overlayId;
                overlay.innerHTML = `
                    <div class="panel-header">
                        <h4>Scratch Arena</h4>
                    </div>
                    <div id="scratch-arena-info-body">等待 VM 初始化...</div>
                `;
                document.body.appendChild(overlay);
                ensurePanelVisibilityButton(overlay);

                return overlay;
            }

            function showWarningDialog(msg) {
                const dialog = document.createElement('dialog');
                dialog.className = 'keyboard-warning-dialog';
                dialog.setAttribute('aria-labelledby', `${overlayId}-warning-title`);
                dialog.setAttribute('aria-describedby', `${overlayId}-warning-message`);
                dialog.innerHTML = `
                    <div class="keyboard-warning-header">
                        <span class="keyboard-warning-icon" aria-hidden="true">!</span>
                        <div>
                            <p class="keyboard-warning-eyebrow">操作提醒</p>
                            <h3 class="keyboard-warning-title" id="${overlayId}-warning-title">檢測已中止</h3>
                        </div>
                    </div>
                    <p class="keyboard-warning-message" id="${overlayId}-warning-message">${msg}</p>
                    <button class="keyboard-warning-button" type="button" autofocus>我知道了</button>
                `;
                const closeButton = dialog.querySelector('button');
                closeButton.addEventListener('click', () => dialog.close());
                dialog.addEventListener('close', () => dialog.remove(), { once: true });
                document.body.appendChild(dialog);
                dialog.showModal();
                closeButton.focus();
            }

            function getCostumeName(target) {
                if (!target) return 'N/A';
                if (typeof target.getCostume === 'function') {
                    const costume = target.getCostume();
                    if (costume && costume.name) return costume.name;
                }
                if (Array.isArray(target.sprite?.costumes) && typeof target.currentCostume === 'number') {
                    return target.sprite.costumes[target.currentCostume]?.name || 'N/A';
                }
                if (Array.isArray(target.costumes) && typeof target.currentCostumeIndex === 'number') {
                    return target.costumes[target.currentCostumeIndex]?.name || 'N/A';
                }
                return target.currentCostume?.name || target.costume?.name || 'N/A';
            }
            
            let remixComparisonStatus = 'unknown';
            let remixComparisonFailures = [];
            let evaluationRunId = 0;
            const expandedWorkflowStages = new Set([0]);
            let previousWorkflowGroupStatuses = null;

            function getProjectIdFromUrl() {
                const match = location.href.match(/projects\/(\d+)/) || location.pathname.match(/projects\/(\d+)/);
                return match ? match[1] : null;
            }

            async function fetchJson(url, options = {}) {
                const response = await fetch(url, Object.assign({ mode: 'cors' }, options));
                if (!response.ok) throw new Error(`${url} ${response.status}`);
                return await response.json();
            }

            async function getRemixSourceProjectId(projectId) {
                const meta = await fetchJson(`https://api.scratch.mit.edu/projects/${projectId}`);
                return meta?.remix?.root || null;
            }
            
            async function getProjectToken(projectId) {
                const meta = await fetchJson(`https://api.scratch.mit.edu/projects/${projectId}`);
                return  meta?.project_token|| null;
            }

            async function loadProjectJson(projectId , token = null) {
                const endpoints = [
                    `https://projects.scratch.mit.edu/${projectId}?token=${token}`
                ];
                let lastError = null;
                for (const url of endpoints) {
                    try {
                        console.log(`嘗試從 ${url} 取得專案 JSON...`);
                        return await fetchJson(url, { headers: { Accept: 'application/json' }, credentials: 'omit' });
                    } catch (err) {
                        lastError = err;
                        console.warn(`ScratchArena: 無法從 ${url} 取得專案 JSON：`, err.message || err);
                        if (err.message && err.message.includes('403')) {
                            continue;
                        }
                    }
                }
                throw new Error(`無法下載專案 JSON，最後一次錯誤：${lastError?.message || '未知'}`);
            }

            function getCurrentProjectJson() {
                if (vm && typeof vm.toJSON === 'function') {
                    try {
                        return vm.toJSON();
                    } catch (err) {
                        return null;
                    }
                }
                return null;
            }

            function normalizeTargetName(target) {
                return target.name || target.sprite?.name || (typeof target.getName === 'function' ? target.getName() : 'unknown');
            }

            async function waitForRuntimeTargets(vmInstance, timeoutMs = 10000) {
                const deadline = Date.now() + timeoutMs;
                while (Date.now() < deadline) {
                    const targets = vmInstance?.runtime?.targets;
                    if (Array.isArray(targets) && targets.length > 0) {
                        return targets;
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                return vmInstance?.runtime?.targets || [];
            }

            function normalizeForComparison(value) {
                if (Array.isArray(value)) {
                    return value.map(item => normalizeForComparison(item));
                }
                if (value && typeof value === 'object') {
                    const normalized = {};
                    Object.keys(value).sort().forEach(key => {
                        if (key === 'id' || key === '_id') return;
                        normalized[key] = normalizeForComparison(value[key]);
                    });
                    return normalized;
                }
                return value;
            }

            function normalizeCostumes(costumes) {
                return (Array.isArray(costumes) ? costumes : []).map(c => ({
                    name: c?.name || '',
                    index: typeof c?.index === 'number' ? c.index : (typeof c?.assetIndex === 'number' ? c.assetIndex : null),
                    assetId: c?.assetId || c?.md5ext || c?.md5 || ''
                })).sort((a, b) => `${a.name}|${a.index ?? ''}|${a.assetId}`.localeCompare(`${b.name}|${b.index ?? ''}|${b.assetId}`));
            }

            function normalizeVariables(variables) {
                const entries = Array.isArray(variables) ? variables : Object.values(variables || {});
                return entries.map(v => {
                    if (Array.isArray(v)) {
                        const name = (typeof v[0] === 'string' ? v[0] : '');
                        const value = (v[1] !== undefined ? v[1] : null);
                        return { name, value: normalizeForComparison(value) };
                    }
                    return { name: v?.name || '', value: normalizeForComparison(typeof v?.value !== 'undefined' ? v.value : null) };
                }).filter(item => item.name || item.value !== null).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
            }


            // 只檢查 source 的每個 variable name 是否存在於 current
            // 不比較 variable value
            // current 可以有額外的 variable name
            // sprite 與 stage 都套用相同邏輯
            function variableNamesMatch(sourceVariables, currentVariables) {
                const sourceNames = new Set(normalizeVariables(sourceVariables).map(variable => variable.name));
                console.log('variableNamesMatch => sourceVariables:', sourceVariables);
                console.log('variableNamesMatch => sourceNames:', sourceNames);
                const currentNames = new Set(normalizeVariables(currentVariables).map(variable => variable.name));
                console.log('variableNamesMatch => currentVariables:', currentVariables);
                console.log('variableNamesMatch => currentNames:', currentNames);
                return [...sourceNames].every(name => currentNames.has(name));
            }


            function normalizeBlockChain(blocksMap, startBlockId) {
                console.log('normalizeBlockChain => ', blocksMap, startBlockId);
                const script = [];
                let currentId = startBlockId;
                while (currentId) {
                    const block = blocksMap.get(currentId);
                    if (!block) break;
                    script.push({
                        opcode: block.opcode,
                        inputs: normalizeForComparison(block.inputs || {}),
                        fields: normalizeForComparison(block.fields || {})
                    });
                    currentId = block.next || null;
                }
                return script;
            }

            function normalizeBlocks(blocks) {
                const rawBlocks = blocks?._blocks || blocks || {};
                // console.log('rawBlocks => ', rawBlocks);
                const allBlocks = Array.isArray(rawBlocks)
                    ? rawBlocks
                    : Object.entries(rawBlocks).map(([id, block]) => ({ id, ...block }));
                // console.log('allBlocks => ', allBlocks);
                const blocksMap = new Map(allBlocks.filter(block => block && typeof block.id === 'string').map(block => [block.id, block]));
                // console.log('blocksMap => ', blocksMap);
                const topLevelBlocks = allBlocks.filter(block => block && typeof block.id === 'string' && block.topLevel === true);
                // console.log('topLevelBlocks => ', topLevelBlocks);
                const scriptChains = topLevelBlocks.map(block => normalizeBlockChain(blocksMap, block.id));
                console.log('normalizeBlocks => ', scriptChains);
                return scriptChains;
            }


            function jsonEqual(a, b) {
                console.log('jsonEqual => A:', a);
                console.log('jsonEqual => B:', b);
                return JSON.stringify(normalizeForComparison(a)) === JSON.stringify(normalizeForComparison(b));
            }

            function compareSprite(name, source, current) {
                if (!source && !current) {
                    return {
                        overallMatch: true,
                        variablesMatch: true,
                        listsMatch: true,
                        blocksMatch: true,
                        costumesMatch: true,               
                        missing: false
                    };
                }
                if (!source || !current) {
                    return {
                        overallMatch: false,
                        variablesMatch: false,
                        listsMatch: false,
                        blocksMatch: false,
                        costumesMatch: false,                       
                        missing: true
                    };
                }

                const variablesMatch = variableNamesMatch(source.variables, current.variables);
                console.log(`sprite:${name}=>  variablesMatch => `, variablesMatch);
                console.log(source.variables);
                console.log(current.variables);
                const listsMatch = variableNamesMatch(source.lists,current.lists);
                console.log(`sprite:${name}=>  listsMatch => `, listsMatch);
                console.log(source.lists);
                console.log(current.lists);
                const blocksMatch = jsonEqual(normalizeBlocks(source.blocks), normalizeBlocks(current.blocks));
                console.log(`sprite:${name}=>  blocksMatch => `, blocksMatch);
                console.log(source.blocks);
                console.log(current.blocks);
                const costumesMatch = jsonEqual(normalizeCostumes(source.costumes), normalizeCostumes(current.costumes));
                console.log(`sprite:${name}=>  costumesMatch => `, costumesMatch);
                console.log(source.costumes);
                console.log(current.costumes);
               

                return {
                    overallMatch: variablesMatch && listsMatch && blocksMatch && costumesMatch ,
                    variablesMatch,
                    listsMatch,
                    blocksMatch,
                    costumesMatch,      
                    missing: false
                };
            }

              

            async function compareProjectToRemixSource() {
                const projectId = getProjectIdFromUrl();
                if (!projectId) {
                    return { status: 'unknown', details: [], error: '無法取得專案 ID' };
                }

                try {
                    const remixSourceId = await getRemixSourceProjectId(projectId);
                    console.log('remixSourceId => ', remixSourceId);
                    if (!remixSourceId) {
                        return { status: 'unknown', details: [], error: '無法取得 remix source ID' };
                    }
                    const currentProjectToken = await getProjectToken(projectId);
                    const currentJson = await loadProjectJson(projectId, currentProjectToken);
                    const remixSourceToken = await getProjectToken(remixSourceId);
                    const sourceJson = await loadProjectJson(remixSourceId, remixSourceToken);
                    const currentTargets = currentJson?.targets || [];                    
                    const sourceTargets = sourceJson?.targets || [];
                    const sourceMap = new Map(sourceTargets.map(t => [normalizeTargetName(t), t]));
                    const currentMap = new Map(currentTargets.map(t => [normalizeTargetName(t), t]));
                    const relevantNames = new Set([...sourceMap.keys(), ...currentMap.keys()].filter(name => name && name !== 'Player'));                    
                    const details = [];
                    // console.log('===================================');
                    // console.log('sourceTargets => ', sourceTargets);
                    // console.log('===================================');
                    // console.log('sourceMap => ', sourceMap);
                    // console.log('currentMap => ', currentMap);
                    // console.log('relevantNames => ', relevantNames);
                    // console.log('===================================');

                    Array.from(relevantNames).sort().forEach(name => {
                        const sourceTarget = sourceMap.get(name);
                        const currentTarget = currentMap.get(name);
                        // console.log( sourceTarget, currentTarget);
                        // console.log('===================================>',name, sourceTarget, currentTarget);
                        const result = compareSprite(name,sourceTarget, currentTarget);
                        
                        const changedItems = [];

                        if (result.missing) {
                            changedItems.push(sourceTarget ? '缺少角色' : '新增角色');
                        } else {
                            if (!result.variablesMatch) changedItems.push('變數');
                            if (!result.listsMatch) changedItems.push('清單');
                            if (!result.blocksMatch) changedItems.push('程式');
                            if (!result.costumesMatch) changedItems.push('造型');                           
                        }

                        details.push({
                            name,
                            overallMatch: result.overallMatch,
                            variablesMatch: result.variablesMatch,
                            listsMatch: result.listsMatch,
                            blocksMatch: result.blocksMatch,
                            costumesMatch: result.costumesMatch,                            
                            changedItems,
                            missing: result.missing
                        });
                    });

                    console.log('===================================');
                    console.log('remix comparison details => ', details);

                    const status = details.length === 0 ? 'unknown' : details.every(item => item.overallMatch) ? 'pass' : 'fail';
                    return { status, details };
                } catch (error) {
                    return { status: 'unknown', details: [], error: error?.message || '比對失敗' };
                }
            }

            function startRemixComparison() {
                const runId = evaluationRunId;
                compareProjectToRemixSource()
                    .then(result => {
                        if (runId !== evaluationRunId) return;
                        remixComparisonStatus = result.status;
                        remixComparisonFailures = result.status === 'fail'
                            ? result.details.filter(item => !item.overallMatch)
                            : [];
                        refreshOverlay();
                    })
                    .catch(error => {
                        if (runId !== evaluationRunId) return;
                        remixComparisonStatus = 'unknown';
                        remixComparisonFailures = [];
                        console.warn('ScratchArena: Remix 比對失敗：', error?.message || error);
                        refreshOverlay();
                    });
            }

            function getProjectStatus(vmInstance) {
                return window.__scratchArenaStore.getState().scratchGui.vmStatus.running? 'running': 'stopped';
            }

            function getTargetScoreValue(target) {
                const variables = target.variables || {};
                const scoreVariable = Object.values(variables).find(v => v.name === 'score');
                return scoreVariable ? scoreVariable.value : null;
            }

            function normalizeTargetState(target) {
                return {
                    x: Math.round(target.x * 100) / 100,
                    y: Math.round(target.y * 100) / 100,
                    direction: target.direction,
                    size: target.size,
                    variables: Object.values(target.variables || {}).map(v => ({ name: v.name, value: v.value })).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
                };
            }

            function getNonPlayerState(targets) {
                return targets
                    .filter(t => {
                        const name = t.sprite?.name || (typeof t.getName === 'function' ? t.getName() : undefined);
                        return name !== 'Player';
                    })
                    .map(t => ({ name: t.sprite?.name || (typeof t.getName === 'function' ? t.getName() : 'unknown'), state: normalizeTargetState(t) }));
            }

            function compareState(a, b) {
                return JSON.stringify(a) === JSON.stringify(b);
            }

            function getBroadcastNames(target) {
                if (!target || !target.blocks) return [];
                const blocks = Array.isArray(target.blocks) ? target.blocks : Object.values(target.blocks._blocks || target.blocks);
                const names = new Set();
                blocks.forEach(block => {
                    if (!block || !block.opcode) return;
                    if (block.opcode.includes('broadcast')) {
                        const fields = block.fields || {};
                        const broadcastField = fields.BROADCAST_OPTION || fields.BROADCAST_INPUT || fields.BROADCAST_MENU || fields.MESSAGE;
                        const value = broadcastField?.value || broadcastField;
                        if (typeof value === 'string' && value.trim().length > 0) {
                            names.add(value);
                        }
                    }
                });
                return [...names];
            }

            function isStage1Passed() {
                if (!workflowState.evaluationStarted || remixComparisonStatus !== 'pass') return false;
                if (getProjectShareStatus() !== 'pass') return false;

                const targets = vm.runtime?.targets || [];
                if (checkModifyScoreVar(targets)) return false;

                const player = targets.find(target => {
                    const name = target.sprite?.name || (typeof target.getName === 'function' ? target.getName() : undefined);
                    return name === 'Player';
                });
                const nonPlayerTargets = targets.filter(target => {
                    const name = target.sprite?.name || (typeof target.getName === 'function' ? target.getName() : undefined);
                    return name !== 'Player';
                });
                const nonPlayerBroadcasts = new Set(getBroadcastNames({
                    blocks: nonPlayerTargets.flatMap(target => Object.values(target.blocks?._blocks || target.blocks || {}))
                }));
                const playerBroadcasts = getBroadcastNames(player);
                return !playerBroadcasts.some(name => nonPlayerBroadcasts.has(name));
            }

            function getShareButton() {
                const selectors = [
                    'button[aria-label="Share"]',
                    'button[aria-label="分享"]',
                    'button[aria-label="Unshare"]',
                    'button[aria-label="取消分享"]',
                    'button[data-test="share-button"]',
                    'button[data-testid="share-button"]',
                    'button[class*="share"]',
                    'button[title*="Share"]',
                    'button[title*="分享"]'
                ];
                for (const selector of selectors) {
                    const button = document.querySelector(selector);
                    if (button) return button;
                }
                return Array.from(document.querySelectorAll('button, a')).find(el => {
                    const text = (el.textContent || '').trim().toLowerCase();
                    return text === 'share' || text === 'unshare' || text === '分享' || text === '已分享' || text === '取消分享';
                }) || null;
            }

            function getSavedStatus(){            
                return !window.__scratchArenaStore.getState().scratchGui.projectChanged?'pass':'fail' ;            
            }

            function getProjectShareStatus() {
               
                const button = getShareButton();
                if (!button) return 'unknown';
                const text = (button.textContent || '').trim().toLowerCase();
                if (!text) return 'unknown';
                if (text.includes('unshare') || text.includes('shared') || text.includes('已分享') || text.includes('取消分享')) {
                    return 'pass';
                }
                if (text.includes('share') || text.includes('分享')) {
                    return 'fail';
                }
                return 'unknown';
            }

            function checkModifyScoreVar(targets) {
                let foundScore = false;
                targets.forEach(target => {
                    const name = target.sprite?.name;
                    if (name === 'Player') {
                        const blocks = target.blocks?._blocks || {};
                        for (const blockId in blocks) {
                            const block = blocks[blockId];
                            if (block.opcode && (block.opcode === 'data_changevariableby' || block.opcode === 'data_setvariableto') && block.fields) {
                                const varName = block.fields.VARIABLE?.value || block.fields.VAR?.value;
                                if (varName === 'Score') {
                                    foundScore = true;
                                }
                            }
                        }
                    }
                });
                return foundScore;
            }

            const workflowState = {
                projectShared:false,
                projectSaved:false,
                evaluationStarted: false,
                greenFlagStarted: false,
                mouseLeftFlag: false,
                keyboardInputDetected: false,
                executionFinished: false,
                successDetected: false,
                uploadReported: false
            };
            const EVALUATION_HOVER_MS = 5000;
            let evaluationHoverStartedAt = null;
            let evaluationHoverTimer = null;
            let pointerPosition = null;

            function findGreenFlagButton() {
                const selectors = [
                    'button[aria-label="Start project"]',
                    'button[aria-label="綠旗"]',
                    'button[title*="Green Flag"]',
                    'button[title*="綠旗"]',
                    '[data-testid="green-flag"]',
                    '[data-test="green-flag"]',
                    '.green-flag',
                    '.stage_green-flag'
                ];
                for (const selector of selectors) {
                    const el = document.querySelector(selector);
                    if (el) return el;
                }
                return null;
            }

            function getWorkflowStatusLabel(status) {
                if (status === 'pass') return '完成';
                if (status === 'fail') return '失敗';
                if (status === 'active') return '進行中';
                if (status === 'locked') return '待啟動';
                return '待檢核';
            }

            function escapeHtml(value) {
                return String(value).replace(/[&<>"']/g, character => ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                })[character]);
            }

            function getNonPlayerCheckDetails() {
                if (remixComparisonStatus !== 'fail') {
                    return '背景與非 Player 角色需與 remix 原始來源一致';
                }

                const failures = remixComparisonFailures.map(item => {
                    const name = item.name === 'Stage' ? '背景' : item.name;
                    return `${name}：${item.changedItems.join('、') || '內容不一致'}`;
                });
                return `未通過：${failures.join('；')}`;
            }

            function renderWorkflowSubStep(stepText, status, subText = '') {
                const icon = status === 'pass' ? '✓' : status === 'fail' ? '✕' : status === 'active' ? '→' : '·';
                return `
                    <li class="workflow-step ${status}">
                        <span class="workflow-icon">${icon}</span>
                        <span>
                            ${stepText}${subText ? `<br><small>${escapeHtml(subText)}</small>` : ''}
                        </span>
                    </li>
                `;
            }

            function renderWorkflowFlow(overallState, shareSaveStatus, scoreStatus, nonPlayerStatus, broadcastStatus, speedStatus) {
                const stage1Ready = workflowState.evaluationStarted;
                const stage1Pass = stage1Ready && shareSaveStatus === 'pass' && scoreStatus === 'pass' && nonPlayerStatus === 'pass' && broadcastStatus === 'pass';
                const stage2Ready = stage1Pass && workflowState.greenFlagStarted;
                const stage2Pass = stage2Ready && !workflowState.mouseLeftFlag && !workflowState.keyboardInputDetected && speedStatus !== 'fail';
                const stage3Ready = stage2Pass && workflowState.successDetected;

                const workflow = [
                    {
                        label: '1. 啟動評估',
                        status: workflowState.evaluationStarted ? (stage1Pass ? 'pass' : 'active') : 'locked',
                        children: [
                            {
                                label: '1.1 作品儲存與分享檢核',
                                status: shareSaveStatus === 'pass' ? 'pass' : shareSaveStatus === 'fail' ? 'fail' : stage1Ready ? 'active' : 'locked',
                                sub: '作品須已儲存並分享'
                            },
                            {
                                label: '1.2 非更動項目檢核',
                                status: nonPlayerStatus === 'pass' ? 'pass' : nonPlayerStatus === 'fail' ? 'fail' : stage1Ready ? 'active' : 'locked',
                                sub: getNonPlayerCheckDetails()
                            },
                            {
                                label: '1.3 Player 程式合規檢核',
                                status: scoreStatus === 'pass' && broadcastStatus === 'pass' ? 'pass' : scoreStatus === 'fail' || broadcastStatus === 'fail' ? 'fail' : stage1Ready ? 'active' : 'locked',
                                sub: '不可修改 Score，且不能使用既有角色廣播事件'
                            }
                        ]
                    },
                    {
                        label: '2. 開始執行',
                        status: workflowState.greenFlagStarted ? (stage2Pass ? 'pass' : 'active') : stage1Pass ? 'active' : 'locked',
                        children: [
                            {
                                label: '2.1 點擊綠色旗幟開始',
                                status: workflowState.greenFlagStarted ? 'pass' : stage1Pass ? 'active' : 'locked',
                                sub: '點擊綠旗後才可進入執行檢核'
                            },
                            {
                                label: '2.2 滑鼠不可離開旗幟',
                                status: workflowState.mouseLeftFlag ? 'fail' : workflowState.greenFlagStarted ? 'active' : 'locked',
                                sub: '執行結果前離開旗幟即判定失敗'
                            },
                            {
                                label: '2.3 鍵盤不可有輸入',
                                status: workflowState.keyboardInputDetected ? 'fail' : workflowState.greenFlagStarted ? 'active' : 'locked',
                                sub: '執行前不可輸入任何鍵盤訊號'
                            },
                            {
                                label: '2.4 Player 每次移動速度 < 10',
                                status: speedStatus === 'pass' ? 'pass' : speedStatus === 'fail' ? 'fail' : workflowState.greenFlagStarted ? 'active' : 'locked',
                                sub: '超過速度上限將直接失敗'
                            }
                        ]
                    },
                    {
                        label: '3. 執行結束',
                        status: workflowState.successDetected ? (workflowState.uploadReported ? 'pass' : 'active') : stage2Pass ? 'active' : 'locked',
                        children: [
                            {
                                label: '3.1 挑戰成功判定',
                                status: workflowState.successDetected ? 'pass' : stage2Pass ? 'active' : 'locked',
                                sub: '判斷成功角色 / 背景已出現'
                            },
                            {
                                label: '3.2 上傳伺服器回報成果',
                                status: workflowState.uploadReported ? 'pass' : workflowState.successDetected ? 'active' : 'locked',
                                sub: '檢核通過後回報服務器'
                            }
                        ]
                    }
                ];

                const workflowGroupStatuses = workflow.map(group => group.status);
                if (previousWorkflowGroupStatuses) {
                    workflowGroupStatuses.forEach((status, index) => {
                        if (previousWorkflowGroupStatuses[index] !== status) {
                            expandedWorkflowStages.add(index);
                        }
                    });
                }
                previousWorkflowGroupStatuses = workflowGroupStatuses;

                const hoverSeconds = evaluationHoverStartedAt === null
                    ? 0
                    : Math.min(EVALUATION_HOVER_MS, Date.now() - evaluationHoverStartedAt) / 1000;
                const evaluationPrompt = workflowState.evaluationStarted
                    ? '檢核啟動'
                    : evaluationHoverStartedAt === null
                        ? `停止專案 + 滑鼠移到綠旗  >>>>  啟動檢核 `
                        : `請保持不動，檢核將在 ${(EVALUATION_HOVER_MS / 1000 - hoverSeconds).toFixed(1)} 秒後啟動`;
                const promptStateClass = workflowState.evaluationStarted
                    ? ''
                    : evaluationHoverStartedAt === null
                        ? ' attention'
                        : ' counting';

                return `
                    <div class="workflow-guidance" role="note">全程保持滑鼠在綠旗按鈕上，禁止所有鍵盤輸入</div>
                    <div class="workflow-button-wrap${promptStateClass}" aria-live="polite">
                        <div class="workflow-status${promptStateClass}">${evaluationPrompt}</div>
                    </div>
                    <ul class="workflow-list">
                        ${workflow.map((group, index) => {
                            const expanded = expandedWorkflowStages.has(index);
                            const icon = group.status === 'pass' ? '✓' : group.status === 'fail' ? '✕' : group.status === 'active' ? '→' : '·';
                            return `
                                <li class="workflow-group ${group.status}${expanded ? ' expanded' : ''}">
                                    <button class="workflow-stage-toggle" type="button" data-workflow-stage="${index}" aria-expanded="${expanded}" aria-controls="workflow-details-${index}">
                                        <span class="workflow-icon" aria-hidden="true">${icon}</span>
                                        <span class="workflow-stage-copy">
                                            <span class="workflow-stage-name">${group.label}</span>
                                            <span class="workflow-stage-status">${getWorkflowStatusLabel(group.status)}</span>
                                        </span>
                                        <span class="workflow-chevron" aria-hidden="true"></span>
                                    </button>
                                    <div class="workflow-details" id="workflow-details-${index}" role="region" aria-label="${group.label}子流程"${expanded ? '' : ' inert'}>
                                        <div class="workflow-details-inner">
                                            <ul class="workflow-sublist">
                                                ${group.children.map(child => renderWorkflowSubStep(child.label, child.status, child.sub)).join('')}
                                            </ul>
                                        </div>
                                    </div>
                                </li>
                            `;
                        }).join('')}
                    </ul>
                `;
            }

            function syncWorkflowMarkup(workflowBox, workflowHtml) {
                const nextMarkup = document.createElement('div');
                nextMarkup.innerHTML = workflowHtml;
                const currentStatus = workflowBox.querySelector('.workflow-status');
                const nextStatus = nextMarkup.querySelector('.workflow-status');
                const currentGroups = workflowBox.querySelectorAll('.workflow-group');
                const nextGroups = nextMarkup.querySelectorAll('.workflow-group');

                if (!currentStatus || !nextStatus || currentGroups.length !== nextGroups.length) {
                    workflowBox.innerHTML = `
                        <div class="workflow-title">評估流程</div>
                        ${workflowHtml}
                    `;
                    return;
                }

                if (currentStatus.textContent !== nextStatus.textContent) {
                    currentStatus.textContent = nextStatus.textContent;
                }
                if (currentStatus.className !== nextStatus.className) {
                    currentStatus.className = nextStatus.className;
                }

                currentGroups.forEach((group, index) => {
                    const nextGroup = nextGroups[index];
                    if (group.className !== nextGroup.className) {
                        group.className = nextGroup.className;
                    }

                    const toggle = group.querySelector('.workflow-stage-toggle');
                    const nextToggle = nextGroup.querySelector('.workflow-stage-toggle');
                    const details = group.querySelector('.workflow-details');
                    const nextDetails = nextGroup.querySelector('.workflow-details');
                    const expanded = nextToggle.getAttribute('aria-expanded') === 'true';
                    toggle.setAttribute('aria-expanded', String(expanded));
                    details.toggleAttribute('inert', !expanded);

                    const stageIcon = toggle.querySelector('.workflow-icon');
                    const nextStageIcon = nextToggle.querySelector('.workflow-icon');
                    if (stageIcon.textContent !== nextStageIcon.textContent) {
                        stageIcon.textContent = nextStageIcon.textContent;
                    }

                    const stageStatus = toggle.querySelector('.workflow-stage-status');
                    const nextStageStatus = nextToggle.querySelector('.workflow-stage-status');
                    if (stageStatus.textContent !== nextStageStatus.textContent) {
                        stageStatus.textContent = nextStageStatus.textContent;
                    }

                    const steps = group.querySelectorAll('.workflow-step');
                    const nextSteps = nextGroup.querySelectorAll('.workflow-step');
                    steps.forEach((step, stepIndex) => {
                        const nextStep = nextSteps[stepIndex];
                        if (!nextStep) return;
                        if (step.className !== nextStep.className) {
                            step.className = nextStep.className;
                        }
                        const icon = step.querySelector('.workflow-icon');
                        const nextIcon = nextStep.querySelector('.workflow-icon');
                        if (icon.textContent !== nextIcon.textContent) {
                            icon.textContent = nextIcon.textContent;
                        }
                        const description = step.querySelector(':scope > span:last-child');
                        const nextDescription = nextStep.querySelector(':scope > span:last-child');
                        if (description && nextDescription && description.innerHTML !== nextDescription.innerHTML) {
                            description.innerHTML = nextDescription.innerHTML;
                        }
                    });
                });
            }

            // 監聽使用者操作事件，並根據條件更新 workflowState
            function registerFlowEventListeners() {
                document.addEventListener('click', (event) => {
                    console.log('Click event detected:', event.target);
                    const flagButton = findGreenFlagButton();
                    if (!flagButton || workflowState.greenFlagStarted || !workflowState.evaluationStarted) return;
                    if (!isStage1Passed()) return;
                    if (event.target === flagButton || flagButton.contains(event.target)) {
                        workflowState.greenFlagStarted = true;
                        greenFlagStartTime = Date.now();
                        playerPreX = null;
                        playerPreY = null;
                        startExecutionMonitoring();
                        refreshOverlay();
                    }
                });

                document.addEventListener('keydown', (event) => {
                    console.log('Keydown event detected:', event.key);                    
                    const targetKey = event.key ? event.key.toLowerCase() : '';
                    if (!['meta', 'control', 'alt', 'shift'].includes(targetKey) && !event.ctrlKey && !event.altKey && !event.metaKey) {
                        workflowState.keyboardInputDetected = true;
                        if(workflowState.evaluationStarted){
                            showWarningDialog('鍵盤輸入，檢測中止！！');
                        }
                        resetEvaluationWorkflow();
                        return;
                    }
                
                });

                document.addEventListener('pointermove', (event) => {
                    pointerPosition = { x: event.clientX, y: event.clientY };
                    const flagButton = findGreenFlagButton();
                    if (!flagButton) {
                        resetEvaluationWorkflow();
                        return;
                    }
                    const rect = flagButton.getBoundingClientRect();
                    const isInside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
                    if (!isInside) {
                        if(workflowState.evaluationStarted){
                            showWarningDialog('滑鼠移出綠旗，檢測中止！！');
                        }
                        resetEvaluationWorkflow();
                        return;
                    }
                    const projectStatus = getProjectStatus();
                    if (projectStatus === 'stopped' && evaluationHoverStartedAt === null && !workflowState.evaluationStarted) {
                        evaluationHoverStartedAt = Date.now();
                        evaluationHoverTimer = setInterval(() => {
                            const currentFlag = findGreenFlagButton();
                            if (!currentFlag) {
                                resetEvaluationWorkflow();
                                return;
                            }
                            const currentRect = currentFlag.getBoundingClientRect();
                            const stillInside = pointerPosition !== null
                                && pointerPosition.x >= currentRect.left
                                && pointerPosition.x <= currentRect.right
                                && pointerPosition.y >= currentRect.top
                                && pointerPosition.y <= currentRect.bottom;
                            if (!stillInside || workflowState.keyboardInputDetected) {
                                resetEvaluationWorkflow();
                                return;
                            }
                            if (Date.now() - evaluationHoverStartedAt >= EVALUATION_HOVER_MS) {
                                clearInterval(evaluationHoverTimer);
                                evaluationHoverTimer = null;
                                startEvaluation();
                            }
                            refreshOverlay();
                        }, 100);
                    }
                    workflowState.mouseLeftFlag = false;
                }, true);
            }

            const overlay = ensureOverlay();
            const overlayBody = overlay.querySelector('#scratch-arena-info-body');
            let executionTimer = null;

            const toolbarObserver = new MutationObserver(() => {
                const button = document.getElementById(`${overlayId}-visibility-toggle`);
                if (!button?.isConnected) ensurePanelVisibilityButton(overlay);
            });
            toolbarObserver.observe(document.body, { childList: true, subtree: true });

            overlayBody.addEventListener('click', event => {
                const toggle = event.target.closest('.workflow-stage-toggle');
                if (!toggle) return;
                const stage = Number(toggle.dataset.workflowStage);
                if (expandedWorkflowStages.has(stage)) {
                    expandedWorkflowStages.delete(stage);
                } else {
                    expandedWorkflowStages.add(stage);
                }
                refreshOverlay();
            });

            function resetEvaluationWorkflow() {
                const wasActive = evaluationHoverStartedAt !== null || workflowState.evaluationStarted || workflowState.greenFlagStarted;
                if (evaluationHoverTimer !== null) {
                    clearInterval(evaluationHoverTimer);
                    evaluationHoverTimer = null;
                }
                evaluationHoverStartedAt = null;
                evaluationRunId += 1;
                workflowState.projectSaved = false;
                workflowState.projectShared = false;
                workflowState.evaluationStarted = false;
                workflowState.greenFlagStarted = false;
                workflowState.mouseLeftFlag = false;
                workflowState.keyboardInputDetected = false;
                workflowState.executionFinished = false;
                workflowState.successDetected = false;
                workflowState.uploadReported = false;
                greenFlagStartTime=null;
                playerPreX = null;
                playerPreY = null;
                remixComparisonStatus = 'unknown';
                remixComparisonFailures = [];
                if (executionTimer !== null) {
                    clearInterval(executionTimer);
                    executionTimer = null;
                }
                if (wasActive) refreshOverlay();
            }

            function startExecutionMonitoring() {
                if (executionTimer !== null) return;
                executionTimer = setInterval(refreshOverlay, 100);
            }

            function startEvaluation() {
                if (workflowState.evaluationStarted) return;
                evaluationRunId += 1;
                workflowState.evaluationStarted = true;
                workflowState.projectShared = getProjectShareStatus();
                workflowState.projectSaved = getSavedStatus();
                startRemixComparison();

                refreshOverlay();
            }

            registerFlowEventListeners();

            function refreshOverlay() {
                const targets = vm.runtime?.targets || [];
                // 尋找 Player 角色
                const player = targets.find(t => {
                    const name = t.sprite?.name || (typeof t.getName === 'function' ? t.getName() : undefined);
                    return name === 'Player';
                });
                // 尋找 Ending Status 角色
                const ending = targets.find(t => {
                    const name = t.sprite?.name || (typeof t.getName === 'function' ? t.getName() : undefined);
                    return name === 'Ending Status';
                });

                
                const isExecutionMonitoring = workflowState.greenFlagStarted;
                const playerX = isExecutionMonitoring && player ? Math.round(player.x * 100) / 100 : '等待開始執行';
                const playerY = isExecutionMonitoring && player ? Math.round(player.y * 100) / 100 : '等待開始執行';
                let playerVelocity = 0;
                if (isExecutionMonitoring && player && playerPreX !== null && playerPreY !== null) {
                    playerVelocity = Math.floor(
                        Math.sqrt((playerX - playerPreX)*(playerX - playerPreX) + (playerY - playerPreY)*(playerY - playerPreY)));
                    }
                    if (isExecutionMonitoring && player) {
                        playerPreX = playerX;
                        playerPreY = playerY;
                    }
                    // 速度計算需考量 fps
                    const playerSpeed = isExecutionMonitoring && player ? Math.round(playerVelocity * 100) / 300 : '等待開始執行';
                    const endingCostume = isExecutionMonitoring ? getCostumeName(ending) : '等待開始執行';
                    
                    const nonPlayerTargets = targets.filter(t => {
                        const name = t.sprite?.name || (typeof t.getName === 'function' ? t.getName() : undefined);
                        return name !== 'Player';
                    });
                    
                    const scoreStatus = workflowState.evaluationStarted
                    ? (checkModifyScoreVar(targets) ? 'fail' : 'pass')
                    : 'unknown';
                    
                    const nonPlayerStatus = remixComparisonStatus === 'pass' ? 'pass' : remixComparisonStatus === 'fail' ? 'fail' : 'unknown';
                    
                    const nonPlayerBroadcasts = new Set(getBroadcastNames({ blocks: nonPlayerTargets.flatMap(t => Object.values(t.blocks?._blocks || t.blocks || {})) }));
                    const playerBroadcasts = getBroadcastNames(player);
                    const broadcastStatus = !workflowState.evaluationStarted
                    ? 'unknown'
                    : playerBroadcasts.length === 0
                    ? 'pass'
                    : playerBroadcasts.some(name => nonPlayerBroadcasts.has(name))
                    ? 'fail'
                    : 'pass';
                    
                    const speedStatus = !isExecutionMonitoring || playerSpeed === '未找到' || playerSpeed === '等待開始執行'
                    ? 'unknown'
                    : playerSpeed < 10
                    ? 'pass'
                    : 'fail';

                    // 如果速度超過 10，且已經超過 EVALUATION_HOVER_MS + 500 毫秒，則顯示警告對話框並重置檢測流程
                    
                    if(workflowState.greenFlagStarted && Date.now() - greenFlagStartTime  > (greenFlagStartTime+500) && speedStatus === 'fail'){
                            showWarningDialog(`Player 移動速度 ${playerSpeed} 超過 10，檢測中止！！`);
                            resetEvaluationWorkflow();
                            return;
                    }
               
                    const workflowHtml = renderWorkflowFlow(
                        { evaluationStarted: workflowState.evaluationStarted, greenFlagStarted: workflowState.greenFlagStarted },
                        workflowState.projectSaved && workflowState.projectShared,
                        scoreStatus,
                        nonPlayerStatus,
                        broadcastStatus,
                        speedStatus
                    );
                    
                    // 取得專案執行狀態
                    const projectStatus = getProjectStatus();
                    const staticFieldsHtml = `
                    <div class="field"><span class="label">Player X:</span> <span class="value">${playerX}</span></div>
                    <div class="field"><span class="label">Player Y:</span> <span class="value">${playerY}</span></div>
                    <div class="field"><span class="label">Player Speed:</span> <span class="value">${playerSpeed}</span> <span class="warning"> <10 </span> </div>
                    <div class="field"><span class="label">Ending Status costume:</span> <span class="value">${endingCostume}</span></div>
                    <div class="field"><span class="label">Project status:</span> <span class="value"><span class="status-pill ${projectStatus}">${projectStatus}</span></span></div>
                    `;
                    
                    let workflowBox = overlayBody.querySelector('.workflow-box');
                    if (!workflowBox) {
                    overlayBody.innerHTML = `
                        ${staticFieldsHtml}
                        <div class="workflow-box">
                            <div class="workflow-title">評估流程</div>
                            ${workflowHtml}
                        </div>
                    `;
                    workflowBox = overlayBody.querySelector('.workflow-box');
                } else {
                    const fieldRows = overlayBody.querySelectorAll('.field');
                    if (fieldRows.length >= 5) {
                        const fieldValues = fieldRows[0].querySelector('.value');
                        const fieldValuesY = fieldRows[1].querySelector('.value');
                        const fieldValuesSpeed = fieldRows[2].querySelector('.value');
                        const fieldValuesEnding = fieldRows[3].querySelector('.value');
                        const projectStatusPill = fieldRows[4].querySelector('.status-pill');

                        if (fieldValues) fieldValues.textContent = String(playerX);
                        if (fieldValuesY) fieldValuesY.textContent = String(playerY);
                        if (fieldValuesSpeed) fieldValuesSpeed.textContent = String(playerSpeed);
                        if (fieldValuesEnding) fieldValuesEnding.textContent = String(endingCostume);
                        if (projectStatusPill) {
                            projectStatusPill.className = `status-pill ${projectStatus}`;
                            projectStatusPill.textContent = projectStatus;
                        }
                    }

                    if (workflowBox) {
                        syncWorkflowMarkup(workflowBox, workflowHtml);
                    }
                }

            }

            refreshOverlay();

        } else if (Date.now() - startedAt < MAX_WAIT_MS) {
            attempts += 1;
            console.log(`尚未找到 VM，等待第 ${attempts} 次重試...`);
            setTimeout(findVm, RETRY_INTERVAL_MS);
        } else {
            console.error("❌ 無法抓取到 VM 物件。請確認您是在「專案編輯器內部」（網址包含 /editor），而非專案簡介外部頁面。");
        }
    }

    findVm();
})();
