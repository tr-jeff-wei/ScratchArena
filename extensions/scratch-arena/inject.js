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
                    #${overlayId} .toggle-button {
                        appearance: none;
                        border: 1px solid rgba(255,255,255,0.18);
                        background: rgba(255,255,255,0.08);
                        color: #f8f8f2;
                        border-radius: 999px;
                        width: 28px;
                        height: 28px;
                        cursor: pointer;
                        font-size: 14px;
                        line-height: 1;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                    }
                    #${overlayId} .toggle-button:hover {
                        background: rgba(255,255,255,0.14);
                    }
                    #${overlayId}.collapsed {
                        min-width: 80px;
                        max-width: 80px;
                        padding: 10px;
                    }
                    #${overlayId}.collapsed .panel-header {
                        margin-bottom: 0;
                    }
                    #${overlayId}.collapsed .field,
                    #${overlayId}.collapsed .constraint-box {
                        display: none;
                    }
                    #${overlayId}.collapsed .status-pill,
                    #${overlayId}.collapsed .constraint-title,
                    #${overlayId}.collapsed .constraint-list {
                        display: none;
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
                    #${overlayId} .constraint-box {
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 1px solid rgba(255,255,255,0.12);
                    }
                    #${overlayId} .workflow-box {
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 1px solid rgba(255,255,255,0.12);
                    }
                    #${overlayId} .constraint-title,
                    #${overlayId} .workflow-title {
                        margin: 0 0 6px;
                        font-size: 11px;
                        color: #c3cbe3;
                    }
                    #${overlayId} .constraint-list,
                    #${overlayId} .workflow-list {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }
                    #${overlayId} .constraint-item,
                    #${overlayId} .workflow-step {
                        display: flex;
                        align-items: flex-start;
                        gap: 8px;
                        margin: 4px 0;
                        color: #d7d7e0;
                        font-size: 11px;
                        line-height: 1.4;
                    }
                    #${overlayId} .constraint-icon,
                    #${overlayId} .workflow-icon {
                        width: 18px;
                        flex-shrink: 0;
                        text-align: center;
                        font-size: 12px;
                        line-height: 1.3;
                    }
                    #${overlayId} .constraint-item.pass .constraint-icon,
                    #${overlayId} .workflow-step.pass .workflow-icon {
                        color: #7cf2a7;
                    }
                    #${overlayId} .constraint-item.fail .constraint-icon,
                    #${overlayId} .workflow-step.fail .workflow-icon {
                        color: #ff8c94;
                    }
                    #${overlayId} .constraint-item.unknown .constraint-icon,
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
                    #${overlayId} .workflow-button {
                        width: 100%;
                        margin: 6px 0 8px;
                        padding: 8px 10px;
                        background: linear-gradient(135deg, rgba(90, 201, 125, 0.22), rgba(90, 201, 125, 0.1));
                        border: 1px solid rgba(90, 201, 125, 0.4);
                        border-radius: 10px;
                        color: #edf7f0;
                        cursor: pointer;
                        font-weight: 700;
                        font-size: 11px;
                    }
                    #${overlayId} .workflow-button:hover {
                        background: linear-gradient(135deg, rgba(90, 201, 125, 0.32), rgba(90, 201, 125, 0.18));
                    }
                    #${overlayId} .workflow-button:disabled {
                        cursor: not-allowed;
                        opacity: 0.45;
                    }
                    #${overlayId} .workflow-sublist {
                        margin-left: 18px;
                        padding-left: 0;
                        list-style: none;
                    }
                    #${overlayId} .comparison-box {
                        margin-top: 14px;
                        padding-top: 10px;
                        border-top: 1px solid rgba(255,255,255,0.12);
                    }
                    #${overlayId} .comparison-title {
                        margin: 0 0 8px;
                        font-size: 11px;
                        color: #c3cbe3;
                    }
                    #${overlayId} #scratch-arena-remix-comparison {
                        max-height: 180px;
                        overflow-y: auto;
                        overflow-x: hidden;
                        padding-right: 6px;
                        scrollbar-width: thin;
                        scrollbar-color: rgba(255,255,255,0.5) rgba(255,255,255,0.08);
                    }
                    #${overlayId} #scratch-arena-remix-comparison::-webkit-scrollbar {
                        width: 8px;
                    }
                    #${overlayId} #scratch-arena-remix-comparison::-webkit-scrollbar-track {
                        background: rgba(255,255,255,0.08);
                        border-radius: 999px;
                    }
                    #${overlayId} #scratch-arena-remix-comparison::-webkit-scrollbar-thumb {
                        background: rgba(255,255,255,0.5);
                        border-radius: 999px;
                        border: 2px solid rgba(255,255,255,0.08);
                    }
                    #${overlayId} #scratch-arena-remix-comparison::-webkit-scrollbar-thumb:hover {
                        background: rgba(255,255,255,0.72);
                    }
                    #${overlayId} .comparison-summary {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 8px;
                        font-size: 11px;
                        color: #d7d7e0;
                    }
                    #${overlayId} .comparison-message {
                        color: #d7d7e0;
                        font-size: 11px;
                        line-height: 1.4;
                    }
                    #${overlayId} .comparison-list {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }
                    #${overlayId} .comparison-item {
                        margin: 8px 0;
                        padding: 10px;
                        border: 1px solid rgba(255,255,255,0.08);
                        border-radius: 10px;
                        background: rgba(255,255,255,0.04);
                    }
                    #${overlayId} .comparison-item-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 6px;
                        font-size: 11px;
                    }
                    #${overlayId} .comparison-item-name {
                        font-weight: 700;
                        color: #f8f8f2;
                    }
                    #${overlayId} .comparison-item-detail {
                        color: #d7d7e0;
                        font-size: 11px;
                        line-height: 1.4;
                    }
                `;
                document.head.appendChild(style);

                overlay = document.createElement('div');
                overlay.id = overlayId;
                overlay.innerHTML = `
                    <div class="panel-header">
                        <h4>Scratch Arena</h4>
                        <button id="${overlayId}-toggle" class="toggle-button" aria-expanded="true" aria-label="Collapse panel">−</button>
                    </div>
                    <div id="scratch-arena-info-body">等待 VM 初始化...</div>
                `;
                document.body.appendChild(overlay);

                const toggleButton = overlay.querySelector(`#${overlayId}-toggle`);
                if (toggleButton) {
                    toggleButton.addEventListener('click', () => {
                        const collapsed = overlay.classList.toggle('collapsed');
                        toggleButton.textContent = collapsed ? '+' : '−';
                        toggleButton.setAttribute('aria-expanded', (!collapsed).toString());
                    });
                }

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
            
            let remixComparison = null;
            let remixComparisonStatus = 'unknown';

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

            function compareSprite(source, current) {
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
                console.log('sprite=>  variablesMatch => ', variablesMatch);
                console.log(source.variables);
                console.log(current.variables);
                const listsMatch = variableNamesMatch(source.lists,current.lists);
                console.log('sprite=>  listsMatch => ', listsMatch);
                console.log(source.lists);
                console.log(current.lists);
                const blocksMatch = jsonEqual(normalizeBlocks(source.blocks), normalizeBlocks(current.blocks));
                console.log('sprite=>  blocksMatch => ', blocksMatch);
                console.log(source.blocks);
                console.log(current.blocks);
                const costumesMatch = jsonEqual(normalizeCostumes(source.costumes), normalizeCostumes(current.costumes));
                console.log('sprite=>  costumesMatch => ', costumesMatch);
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
                        const result = compareSprite(sourceTarget, currentTarget);
                        
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

            function renderComparisonItem(item) {
                const statusText = item.overallMatch ? '未修改' : '已修改';
                const changedText = item.missing ? '角色數量變動' : (item.changedItems.length ? item.changedItems.join('、') : '無變更');
                return `
                    <li class="comparison-item ${item.overallMatch ? 'pass' : 'fail'}">
                        <div class="comparison-item-header">
                            <span class="comparison-item-name">${item.name}</span>
                            <span class="status-pill ${item.overallMatch ? 'running' : 'stopped'}">${statusText}</span>
                        </div>
                        <div class="comparison-item-detail">差異：${changedText}</div>
                        <div class="comparison-item-detail">變數：${item.variablesMatch ? 'O' : 'X'}，清單：${item.listsMatch ? 'O' : 'X'}，程式：${item.blocksMatch ? 'O' : 'X'}，造型：${item.costumesMatch ? 'O' : 'X'}</div>
                    </li>
                `;
            }

            function renderRemixComparisonHtml(comparison) {
                if (!comparison) {
                    return '<div class="comparison-message">比對中...</div>';
                }
                if (comparison.error) {
                    return `<div class="comparison-message">錯誤：${comparison.error}</div>`;
                }
                if (!comparison.details || comparison.details.length === 0) {
                    return '<div class="comparison-message">未找到非 Player 角色可比對。</div>';
                }
                const title = comparison.status === 'pass' ? '全部相同' : comparison.status === 'fail' ? '已修改' : '未知';
                return `
                    <div class="comparison-summary">
                        <span class="comparison-label">Remix 比對結果：</span>
                        <span class="status-pill ${comparison.status}">${title}</span>
                    </div>
                    <ul class="comparison-list">
                        ${comparison.details.map(item => renderComparisonItem(item)).join('')}
                    </ul>
                `;
            }

            let remixComparisonRendered = false;

            function refreshRemixComparisonBlock() {
                const comparisonContainer = overlayBody?.querySelector('#scratch-arena-remix-comparison');
                if (!comparisonContainer) return;
                comparisonContainer.innerHTML = renderRemixComparisonHtml(remixComparison);
            }

            function startRemixComparison() {
                compareProjectToRemixSource()
                    .then(result => {
                        remixComparison = result;
                        remixComparisonStatus = result.status;
                        refreshRemixComparisonBlock();
                        remixComparisonRendered = true;
                        refreshOverlay();
                    })
                    .catch(error => {
                        remixComparison = { status: 'unknown', details: [], error: error?.message || '比對失敗' };
                        remixComparisonStatus = 'unknown';
                        refreshRemixComparisonBlock();
                        remixComparisonRendered = true;
                        refreshOverlay();
                    });
            }

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

            function getProjectShareStatus() {
                const store = window.__scratchArenaStore;
                if (store && typeof store.getState === 'function') {
                    const state = store.getState();
                    const sharePaths = [
                        state.scratchGui?.projectInfo,
                        state.scratchGui?.projectState,
                        state.scratchGui?.sharingState,
                        state.scratchGui?.sharedProject,
                        state.scratchGui?.project?.sharingState,
                        state.scratchGui?.project?.shared
                    ];
                    for (const candidate of sharePaths) {
                        if (candidate == null) continue;
                        if (typeof candidate === 'boolean') {
                            return candidate ? 'pass' : 'fail';
                        }
                        if (typeof candidate === 'string') {
                            const text = candidate.trim().toLowerCase();
                            if (text === 'shared' || text === '已分享' || text === 'true') return 'pass';
                            if (text === 'unshared' || text === 'share' || text === '分享' || text === 'false') return 'fail';
                        }
                        if (typeof candidate === 'object') {
                            if (typeof candidate.shared === 'boolean') {
                                return candidate.shared ? 'pass' : 'fail';
                            }
                            if (typeof candidate.sharingState === 'string') {
                                const text = candidate.sharingState.trim().toLowerCase();
                                if (text === 'shared' || text === '已分享') return 'pass';
                                if (text === 'unshared' || text === 'share' || text === '分享') return 'fail';
                            }
                        }
                    }
                }

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

            function renderConstraintItem(text, status) {
                const icon = status === 'pass' ? '✓' : status === 'fail' ? '✕' : '·';
                return `
                    <li class="constraint-item ${status}">
                        <span class="constraint-icon">${icon}</span>
                        <span>${text}</span>
                    </li>
                `;
            }

            const workflowState = {
                evaluationStarted: false,
                greenFlagStarted: false,
                mouseLeftFlag: false,
                keyboardInputDetected: false,
                executionFinished: false,
                successDetected: false,
                uploadReported: false
            };

            function findGreenFlagButton() {
                const selectors = [
                    'button[aria-label="Green Flag"]',
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

            function renderWorkflowSubStep(stepText, status, subText = '') {
                const icon = status === 'pass' ? '✓' : status === 'fail' ? '✕' : status === 'active' ? '→' : '·';
                return `
                    <li class="workflow-step ${status}">
                        <span class="workflow-icon">${icon}</span>
                        <span>
                            ${stepText}${subText ? `<br><small>${subText}</small>` : ''}
                        </span>
                    </li>
                `;
            }

            function renderWorkflowFlow(overallState, shareStatus, scoreStatus, nonPlayerStatus, broadcastStatus, speedStatus) {
                const stage1Ready = workflowState.evaluationStarted;
                const stage1Pass = stage1Ready && shareStatus === 'pass' && scoreStatus === 'pass' && nonPlayerStatus === 'pass' && broadcastStatus === 'pass';
                const stage2Ready = stage1Pass && workflowState.greenFlagStarted;
                const stage2Pass = stage2Ready && !workflowState.mouseLeftFlag && !workflowState.keyboardInputDetected && speedStatus !== 'fail';
                const stage3Ready = stage2Pass && workflowState.successDetected;

                const workflow = [
                    {
                        label: '1. 啟動評估',
                        status: workflowState.evaluationStarted ? (stage1Pass ? 'pass' : 'active') : 'locked',
                        children: [
                            {
                                label: '1.1 非更動項目檢核',
                                status: shareStatus === 'pass' && nonPlayerStatus === 'pass' ? 'pass' : shareStatus === 'fail' || nonPlayerStatus === 'fail' ? 'fail' : stage1Ready ? 'active' : 'locked',
                                sub: '背景與非 Player 角色需與 remix 原始來源一致'
                            },
                            {
                                label: '1.2 Player 程式合規檢核',
                                status: scoreStatus === 'pass' && broadcastStatus === 'pass' ? 'pass' : scoreStatus === 'fail' || broadcastStatus === 'fail' ? 'fail' : stage1Ready ? 'active' : 'locked',
                                sub: '不可修改 Score，且不能使用非 Player 角色廣播事件'
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

                const isReady = workflowState.evaluationStarted && stage1Pass && workflowState.greenFlagStarted && stage2Pass;

                return `
                    <div class="workflow-button-wrap">
                        <button id="scratch-arena-start-evaluation" class="workflow-button" ${workflowState.evaluationStarted ? 'disabled' : ''}>
                            ${workflowState.evaluationStarted ? '已啟動評估' : '啟動評估'}
                        </button>
                    </div>
                    <ul class="workflow-list">
                        ${workflow.map(group => `
                            <li class="workflow-step ${group.status}">
                                <span class="workflow-icon">${group.status === 'pass' ? '✓' : group.status === 'fail' ? '✕' : group.status === 'active' ? '→' : '·'}</span>
                                <span>
                                    <strong>${group.label}</strong>
                                    <ul class="workflow-sublist">
                                        ${group.children.map(child => renderWorkflowSubStep(child.label, child.status, child.sub)).join('')}
                                    </ul>
                                </span>
                            </li>
                        `).join('')}
                    </ul>
                `;
            }

            function registerFlowEventListeners() {
                document.addEventListener('click', (event) => {
                    const clickedElement = event.target instanceof Element ? event.target : null;
                    if (!workflowState.evaluationStarted && clickedElement?.closest('#scratch-arena-start-evaluation')) {
                        startEvaluation();
                        return;
                    }
                    const flagButton = findGreenFlagButton();
                    if (!flagButton || workflowState.greenFlagStarted || !workflowState.evaluationStarted) return;
                    if (!isStage1Passed()) return;
                    if (event.target === flagButton || flagButton.contains(event.target)) {
                        workflowState.greenFlagStarted = true;
                        playerPreX = null;
                        playerPreY = null;
                        startExecutionMonitoring();
                        refreshOverlay();
                    }
                });

                document.addEventListener('keydown', (event) => {
                    if (workflowState.greenFlagStarted && !workflowState.executionFinished && !event.repeat) {
                        const targetKey = event.key ? event.key.toLowerCase() : '';
                        if (!['meta', 'control', 'alt', 'shift'].includes(targetKey) && !event.ctrlKey && !event.altKey && !event.metaKey) {
                            workflowState.keyboardInputDetected = true;
                        }
                    }
                });

                document.addEventListener('pointermove', (event) => {
                    if (!workflowState.greenFlagStarted || workflowState.executionFinished) return;
                    const flagButton = findGreenFlagButton();
                    if (!flagButton) return;
                    const rect = flagButton.getBoundingClientRect();
                    const isInside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
                    if (!isInside) {
                        workflowState.mouseLeftFlag = true;
                    }
                });
            }

            const overlay = ensureOverlay();
            const overlayBody = overlay.querySelector('#scratch-arena-info-body');
            let executionTimer = null;

            function startExecutionMonitoring() {
                if (executionTimer !== null) return;
                executionTimer = setInterval(refreshOverlay, 100);
            }

            function startEvaluation() {
                if (workflowState.evaluationStarted) return;
                workflowState.evaluationStarted = true;
                startRemixComparison();
                refreshOverlay();
            }

            registerFlowEventListeners();

            function refreshOverlay() {
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
                const shareStatus = workflowState.evaluationStarted ? getProjectShareStatus() : 'unknown';
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

                const constraintHtml = [
                    renderConstraintItem('專案需為 [已分享] 狀態', shareStatus),
                    renderConstraintItem('不能修改變數 Score', scoreStatus),
                    renderConstraintItem('不能更動所有非玩家的角色內容', nonPlayerStatus),
                    renderConstraintItem('Player 角色不能使用所有非玩家角色的廣播事件，但可以建構新的廣播事件', broadcastStatus),
                    renderConstraintItem('Player 每次移動限制速度 < 10', speedStatus)
                ].join('');

                const workflowHtml = renderWorkflowFlow(
                    { evaluationStarted: workflowState.evaluationStarted, greenFlagStarted: workflowState.greenFlagStarted },
                    shareStatus,
                    scoreStatus,
                    nonPlayerStatus,
                    broadcastStatus,
                    speedStatus
                );

                const staticFieldsHtml = `
                    <div class="field"><span class="label">Player X:</span> <span class="value">${playerX}</span></div>
                    <div class="field"><span class="label">Player Y:</span> <span class="value">${playerY}</span></div>
                    <div class="field"><span class="label">Player Speed:</span> <span class="value">${playerSpeed}</span> <span class="warning"> <10 </span> </div>
                    <div class="field"><span class="label">Ending Status costume:</span> <span class="value">${endingCostume}</span></div>
                    <div class="field"><span class="label">Project status:</span> <span class="value"><span class="status-pill ${projectStatus}">${projectStatus}</span></span></div>
                `;

                const constraintBox = overlayBody.querySelector('.constraint-box');
                if (!constraintBox) {
                    overlayBody.innerHTML = `
                        ${staticFieldsHtml}
                        <div class="workflow-box">
                            <div class="workflow-title">評估流程</div>
                            ${workflowHtml}
                        </div>
                        <div class="constraint-box">
                            <div class="constraint-title">專案條件檢查</div>
                            <ul class="constraint-list">
                                ${constraintHtml}
                            </ul>
                            <div class="comparison-box">
                                <div class="comparison-title">Remix source 比對結果</div>
                                <div id="scratch-arena-remix-comparison"></div>
                            </div>
                        </div>
                    `;
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

                    const constraintList = constraintBox.querySelector('.constraint-list');
                    if (constraintList) {
                        constraintList.innerHTML = constraintHtml;
                    }

                    const workflowBox = overlayBody.querySelector('.workflow-box');
                    if (workflowBox) {
                        workflowBox.innerHTML = `
                            <div class="workflow-title">評估流程</div>
                            ${workflowHtml}
                        `;
                    }
                }

                const startButton = overlayBody.querySelector('#scratch-arena-start-evaluation');
                if (startButton && !workflowState.evaluationStarted) {
                    startButton.addEventListener('click', startEvaluation, { once: true });
                }

                if (remixComparisonRendered && remixComparison) {
                    refreshRemixComparisonBlock();
                }

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
