(function () {
  const SOURCE = "scratch-arena-quiz-checker";

  function findVm() {
    const root = document.getElementById("app");
    if (!root) return null;

    const pending = [root];
    const visited = new Set();

    while (pending.length) {
      const node = pending.pop();
      if (!node || visited.has(node)) continue;
      visited.add(node);

      for (const key of Object.keys(node)) {
        if (!key.startsWith("__reactContainer")) continue;
        const fiberStack = [node[key]];
        while (fiberStack.length) {
          const fiber = fiberStack.pop();
          if (!fiber) continue;

          const store = fiber.memoizedProps?.store || fiber.pendingProps?.store;
          const vm = store?.getState?.().scratchGui?.vm;
          if (vm) return vm;

          if (fiber.sibling) fiberStack.push(fiber.sibling);
          if (fiber.child) fiberStack.push(fiber.child);
        }
      }
    }

    return window.vm || null;
  }

  function getBlocks(target) {
    return target?.blocks?._blocks || {};
  }

  function getBlockIdsFromInput(value, blocks, ids) {
    if (typeof value === "string") {
      if (blocks[value]) ids.add(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => getBlockIdsFromInput(item, blocks, ids));
    }
  }

  function getGreenFlagBlocks(target) {
    const blocks = getBlocks(target);
    const visited = new Set();
    const opcodes = new Set();
    const assignments = new Set();

    function visit(blockId) {
      if (!blockId || visited.has(blockId) || !blocks[blockId]) return;
      visited.add(blockId);

      const block = blocks[blockId];
      if (block.opcode) opcodes.add(block.opcode);
      if (block.opcode === "data_setvariableto") {
        console.log(`var:`,block);
        const variableId = block.fields?.VARIABLE?.id;
        if (variableId) assignments.add(variableId);
      }

      if (block.next) visit(block.next);

      for (const input of Object.values(block.inputs || {})) {
        const inputBlockIds = new Set();
        getBlockIdsFromInput(input, blocks, inputBlockIds);
        inputBlockIds.forEach(visit);
      }
    }

    for (const [blockId, block] of Object.entries(blocks)) {
      if (block.opcode === "event_whenflagclicked" && block.topLevel) {
        visit(blockId);
      }
    }

    return { opcodes, assignments };
  }

  function createGroup(groups, name, type) {
    const existing = groups.find((group) => group.name === name);
    if (existing) return existing;

    const group = { name, type, checks: [] };
    groups.push(group);
    return group;
  }

  function addCheck(group, label, passed, detail) {
    group.checks.push({ label, passed, detail });
  }

  function checkProject(vm) {
    const targets = (vm.runtime?.targets || []).filter((target) => target.isOriginal !== false);
    const sprites = targets.filter((target) => !target.isStage);
    const stage = targets.find((target) => target.isStage);
    const groups = [];
    const stageGroup = createGroup(groups, "Stage", "stage");

    if (!sprites.length) {
      const group = createGroup(groups, "角色", "sprite");
      addCheck(group, "角色啟動流程", false, "目前專案沒有可檢查的角色。");
    }

    const requiredSpriteBlocks = [
      { label: "設定位置", opcodes: ["motion_gotoxy", "motion_goto"] },
      { label: "設定方向", opcodes: ["motion_pointindirection"] },
      { label: "設定造型", opcodes: ["looks_switchcostumeto"] },
      { label: "設定可見度", opcodes: ["looks_show", "looks_hide"] },
      { label: "設定大小", opcodes: ["looks_setsizeto"] }
    ];

    for (const sprite of sprites) {
      const name = sprite.sprite?.name || sprite.getName?.() || "未命名角色";
      const group = createGroup(groups, name, "sprite");
      const { opcodes } = getGreenFlagBlocks(sprite);

      for (const requirement of requiredSpriteBlocks) {
        const passed = requirement.opcodes.some((opcode) => opcodes.has(opcode));
        addCheck(
          group,
          `${name}：${requirement.label}`,
          passed,
          passed ? "已在綠旗啟動流程中找到。" : "綠旗啟動流程中找不到所需積木。"
        );
      }
    }

    const endingStatus = sprites.find((sprite) => sprite.sprite?.name === "Ending Status");
    const endingStatusGroup = createGroup(groups, "Ending Status", "sprite");
    if (!endingStatus) {
      addCheck(endingStatusGroup, "角色存在", false, "找不到名為 Ending Status 的角色。");
    } else {
      const costumes = endingStatus.sprite?.costumes || [];
      const costumeNames = costumes.map((costume) => costume.name);
      const hasRequiredCostumes = costumes.length === 3 && ["N", "W", "L"].every((name) => costumeNames.includes(name));
      addCheck(
        endingStatusGroup,
        "造型為 N、W、L",
        hasRequiredCostumes,
        hasRequiredCostumes ? "造型為 N、W、L。" : `目前造型：${costumeNames.join("、") || "無"}；需要且只能有 N、W、L。`
      );
    }

    const hasPlayer = sprites.some((sprite) => sprite.sprite?.name === "Player");
    const playerGroup = createGroup(groups, "Player", "sprite");
    addCheck(playerGroup, "角色存在", hasPlayer, hasPlayer ? "已建立 Player 角色。" : "找不到名為 Player 的角色。");

    if (!stage) {
      addCheck(stageGroup, "背景啟動流程", false, "找不到 Stage，無法檢查背景與變數初始化。");
    } else {
      const { opcodes, assignments } = getGreenFlagBlocks(stage);
      const hasBackdrop = opcodes.has("looks_switchbackdropto");
      addCheck(
        stageGroup,
        "設定背景",
        hasBackdrop,
        hasBackdrop ? "已在綠旗啟動流程中找到。" : "Stage 的綠旗啟動流程中找不到切換背景積木。"
      );

      const variables = stage.variables || {};
      console.log(variables);
      const uninitialized = Object.entries(variables)
        .filter(([variableId, variable]) => variable.type !== "broadcast_msg" && !assignments.has(variableId))
        .map(([, variable]) => variable.name || "未命名變數");
      console.log(assignments);
      console.log(uninitialized);
      console.log(`uninitialized2:`, Object.entries(variables)
        .filter(([variableId]) => !assignments.has(variableId)));

      addCheck(
        stageGroup,
        "初始化所有變數",
        uninitialized.length === 0,
        uninitialized.length ? `尚未初始化：${uninitialized.join("、")}` : "所有 Stage 變數均已在綠旗啟動流程設定初始值。"
      );
    }

    return {
      passed: groups.every((group) => group.checks.every((check) => check.passed)),
      groups
    };
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.source !== SOURCE || event.data.type !== "RUN_CHECK") return;

    const vm = findVm();
    const result = vm
      ? checkProject(vm)
      : { error: "找不到 Scratch VM，請確認目前頁面是專案編輯器。" };

    window.postMessage({ source: SOURCE, type: "CHECK_RESULT", result }, "*");
  });
})();