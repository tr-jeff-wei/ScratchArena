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
            console.log("快速測試：請輸入 `console.table(window.vm.runtime.targets.map(t => t.sprite.name))` 來查看所有角色。"
            );

            setInterval(() => {

                const sprites = vm.runtime.targets.map(target => ({

                    name: target.sprite.name,
                    x: target.x,
                    y: target.y,
                    direction: target.direction,
                    size: target.size,

                    variables: Object.values(target.variables).map(v => ({

                        name: v.name,
                        value: v.value

                    }))

                }));
                console.log("sprites => ", sprites);
                window.postMessage({

                    type: "SCRATCH_INFO",
                    sprites

                }, "*");

            }, 1000);



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
