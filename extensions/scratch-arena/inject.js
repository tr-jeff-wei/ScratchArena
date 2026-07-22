(function () {
    const MAX_WAIT_MS = 10000;
    const RETRY_INTERVAL_MS = 200;
    const startedAt = Date.now();
    let attempts = 0;

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
                        top: 12px;
                        right: 12px;
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

            function getProjectStatus(vmInstance) {
                const threads = vmInstance.runtime?.threads;
                if (Array.isArray(threads) && threads.length > 0) {
                    const isRunning = threads.some(thread => {
                        if (thread?.status !== undefined) {
                            return thread.status !== 0;
                        }
                        if (Array.isArray(thread?.stack) && thread.stack.length > 0) {
                            return true;
                        }
                        return false;
                    });
                    return isRunning ? 'running' : 'end';
                }
                return 'end';
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
                const endingCostume = getCostumeName(ending);

                overlayBody.innerHTML = `
                    <div class="field"><span class="label">Player X:</span> <span class="value">${playerX}</span></div>
                    <div class="field"><span class="label">Player Y:</span> <span class="value">${playerY}</span></div>
                    <div class="field"><span class="label">Ending Status costume:</span> <span class="value">${endingCostume}</span></div>
                    <div class="field"><span class="label">Project status:</span> <span class="value">${projectStatus}</span></div>
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
