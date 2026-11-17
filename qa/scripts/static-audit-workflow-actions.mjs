// Workflows locais executam o mesmo commit do chamador; suas Actions remotas
// continuam exigindo SHA completo, inclusive em chamadas locais encadeadas.
export function workflowActionsArePinned(content, readLocalWorkflow, ancestors = new Set()) {
  const actions = [...content.matchAll(/^\s*(?:-\s+)?uses:\s*([^\s#]+)/gm)]
    .map((match) => match[1]);

  return actions.length > 0 && actions.every((action) => {
    if (!action.startsWith("./")) return /^[^@\s]+@[0-9a-f]{40}$/.test(action);

    if (!/^\.\/\.github\/workflows\/[A-Za-z0-9_-]+\.ya?ml$/.test(action) ||
        ancestors.has(action)) return false;

    try {
      return workflowActionsArePinned(
        readLocalWorkflow(action),
        readLocalWorkflow,
        new Set([...ancestors, action]),
      );
    } catch {
      return false;
    }
  });
}
