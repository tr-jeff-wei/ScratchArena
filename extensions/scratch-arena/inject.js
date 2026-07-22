(function () {
    const MAX_WAIT_MS = 10000;
    const RETRY_INTERVAL_MS = 200;
    const startedAt = Date.now();
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
                    vm = store.getState().scratchGui?.vm;
                    if (vm) break;
                }
                current = current.child;
            }
        }

        console.log("vm => ", vm);
        if (vm) {
            window.vm = vm;
            console.log("✅ 成功獲取 Scratch VM！現在您可以使用 window.vm 來查詢角色了。");
            console.log("快速測試：請輸入 `console.table(window.vm.runtime.targets.map(t => t.sprite.name))` 來查看所有角色。");

            const overlayId = 'scratch-arena-info';
            const styleId = 'scratch-arena-info-style';

            function ensureOverlay() {
                let overlay = document.getElementById(overlayId);
                if (overlay) return overlay;

                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = `
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
                    #${overlayId} h4 {
                        margin: 0 0 8px;
                        font-size: 13px;
                        letter-spacing: 0.03em;
                        color: #a7d2ff;
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
                    #${overlayId} .status-pill.running {
                        color: #9ef2c1;
                        background: rgba(38, 161, 105, 0.16);
                        border: 1px solid rgba(38, 161, 105, 0.28);
                    }
                    #${overlayId} .status-pill.stopped {
                        color: #ffb7b8;
                        background: rgba(198, 73, 88, 0.16);
                        border: 1px solid rgba(198, 73, 88, 0.28);
                    }
                    #${overlayId} .status-pill.unknown {
                        color: #ffd56e;
                        background: rgba(255, 182, 74, 0.16);
                        border: 1px solid rgba(255, 182, 74, 0.28);
                    }
                    #${overlayId} .constraint-box {
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 1px solid rgba(255,255,255,0.12);
                    }
                    #${overlayId} .constraint-title {
                        margin: 0 0 6px;
                        font-size: 11px;
                        color: #c3cbe3;
                    }
                    #${overlayId} .constraint-list {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }
                    #${overlayId} .constraint-item {
                        display: flex;
                        align-items: flex-start;
                        gap: 8px;
                        margin: 4px 0;
                        color: #d7d7e0;
                        font-size: 11px;
                        line-height: 1.4;
                    }
                    #${overlayId} .constraint-icon {
                        width: 18px;
                        flex-shrink: 0;
                        text-align: center;
                        font-size: 12px;
                        line-height: 1.3;
                    }
                    #${overlayId} .constraint-item.pass .constraint-icon {
                        color: #7cf2a7;
                    }
                    #${overlayId} .constraint-item.fail .constraint-icon {
                        color: #ff8c94;
                    }
                    #${overlayId} .constraint-item.unknown .constraint-icon {
                        color: #f9d56e;
                    }
                `;
                document.head.appendChild(style);

                overlay = document.createElement('div');
                overlay.id = overlayId;
                overlay.innerHTML = '<h4>Scratch Arena</h4><div id="scratch-arena-info-body">等待 VM 初始化...</div>';
                document.body.appendChild(overlay);
                return overlay;
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

            let initialScoreState = null;
            let initialNonPlayerState = null;

            function getProjectStatus(vmInstance) {
                return vmInstance.runtime.threads.length > 0 ? 'running' : 'stopped';
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
                    variables: Object.values(target.variables || {}).map(v => ({ name: v.name, value: v.value })).sort((a, b) => a.name.localeCompare(b.name))
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

            function getAllScoreValues(targets) {
                const scoreMap = {};
                targets.forEach(target => {
                    const name = target.sprite?.name || (typeof target.getName === 'function' ? target.getName() : 'unknown');
                    const scoreVariable = Object.values(target.variables || {}).find(v => v.name === 'score');
                    if (scoreVariable) scoreMap[name] = scoreVariable.value;
                });
                return scoreMap;
            }

            function renderConstraintItem(text, status) {
                const icon = status === 'pass' ? '✓' : status === 'fail' ? '✕' : '·';
                return `
                    <li class="constraint-item ${status}">
                        <span class="constraint-icon">${icon}</span>
                        <span>${text}</span>
                    </li>
                `;
            }

            const overlay = ensureOverlay();
            const overlayBody = overlay.querySelector('#scratch-arena-info-body');

            setInterval(() => {
                const targets = vm.runtime?.targets || [];
                const player = targets.find(t => {
                    const name = t.sprite?.name || (typeof t.getName === 'function' ? t.getName() : undefined);
                    return name === 'Player';
                });
                const ending = targets.find(t => {
                    const name = t.sprite?.name || (typeof t.getName === 'function' ? t.getName() : undefined);
                    return name === 'Ending Status';
                });
                const projectStatus = getProjectStatus(vm);

                const playerX = player ? Math.round(player.x * 100) / 100 : '未找到';
                const playerY = player ? Math.round(player.y * 100) / 100 : '未找到';
                let playerVelocity = 0;
                if ( playerPreX && playerPreY ) {
                    playerVelocity = Math.sqrt((playerX - playerPreX)*(playerX - playerPreX) + (playerY - playerPreY)*(playerY - playerPreY));
                }
                playerPreX = playerX;
                playerPreY = playerY;                
                // 速度計算需考量 fps
                const playerSpeed = player ? Math.round(playerVelocity * 100) / 300 : '未找到';
                const endingCostume = getCostumeName(ending);

                const currentScoreState = getAllScoreValues(targets);
                if (initialScoreState === null) initialScoreState = currentScoreState;

                const nonPlayerTargets = targets.filter(t => {
                    const name = t.sprite?.name || (typeof t.getName === 'function' ? t.getName() : undefined);
                    return name !== 'Player';
                });
                if (initialNonPlayerState === null) initialNonPlayerState = getNonPlayerState(targets);

                const scoreStatus = (Object.keys(initialScoreState).length === 0 && Object.keys(currentScoreState).length === 0)
                    ? 'unknown'
                    : compareState(initialScoreState, currentScoreState)
                        ? 'pass'
                        : 'fail';

                const nonPlayerStatus = (initialNonPlayerState === null)
                    ? 'unknown'
                    : compareState(initialNonPlayerState, getNonPlayerState(targets))
                        ? 'pass'
                        : 'fail';

                const nonPlayerBroadcasts = new Set(getBroadcastNames({ blocks: nonPlayerTargets.flatMap(t => Object.values(t.blocks?._blocks || t.blocks || {})) }));
                const playerBroadcasts = getBroadcastNames(player);
                const broadcastStatus = playerBroadcasts.length === 0
                    ? 'pass'
                    : playerBroadcasts.some(name => nonPlayerBroadcasts.has(name))
                        ? 'fail'
                        : 'pass';

                const speedStatus = playerSpeed === '未找到'
                    ? 'unknown'
                    : playerSpeed < 10
                        ? 'pass'
                        : 'fail';

                const constraintHtml = [
                    renderConstraintItem('不能修改變數 score', scoreStatus),
                    renderConstraintItem('不能更動所有非玩家的角色內容', nonPlayerStatus),
                    renderConstraintItem('Player 角色不能使用所有非玩家角色的廣播事件，但可以建構新的廣播事件', broadcastStatus),
                    renderConstraintItem('Player 每次移動限制速度 < 10', speedStatus)
                ].join('');

                overlayBody.innerHTML = `
                    <div class="field"><span class="label">Player X:</span> <span class="value">${playerX}</span></div>
                    <div class="field"><span class="label">Player Y:</span> <span class="value">${playerY}</span></div>
                    <div class="field"><span class="label">Player Speed:</span> <span class="value">${playerSpeed}</span> <span class="warning"> <10 </span> </div>
                    <div class="field"><span class="label">Ending Status costume:</span> <span class="value">${endingCostume}</span></div>
                    <div class="field"><span class="label">Project status:</span> <span class="value"><span class="status-pill ${projectStatus}">${projectStatus}</span></span></div>
                    <div class="constraint-box">
                        <div class="constraint-title">限制條件檢查</div>
                        <ul class="constraint-list">
                            ${constraintHtml}
                        </ul>
                    </div>
                `;

                const sprites = targets.map(target => ({
                    name: target.sprite?.name || (typeof target.getName === 'function' ? target.getName() : 'unknown'),
                    x: target.x,
                    y: target.y,
                    direction: target.direction,
                    size: target.size,
                    variables: Object.values(target.variables || {}).map(v => ({
                        name: v.name,
                        value: v.value
                    }))
                }));
                window.postMessage({
                    type: "SCRATCH_INFO",
                    sprites
                }, "*");
            }, 100);

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
