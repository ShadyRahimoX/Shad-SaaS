interface SSEController {
  writeSSE(data: { event?: string; data: string; id?: string }): Promise<void>;
}

const connections = new Map<string, Set<SSEController>>();

export function registerConnection(userId: string, controller: SSEController) {
  let userSet = connections.get(userId);
  if (!userSet) {
    userSet = new Set();
    connections.set(userId, userSet);
  }
  userSet.add(controller);
  console.log(`[SSE] Connected: user ${userId} (total connections: ${userSet.size})`);
}

export function unregisterConnection(userId: string, controller: SSEController) {
  const userSet = connections.get(userId);
  if (userSet) {
    userSet.delete(controller);
    console.log(`[SSE] Disconnected: user ${userId} (remaining: ${userSet.size})`);
    if (userSet.size === 0) {
      connections.delete(userId);
    }
  }
}

export function pushToUser(userId: string, event: { type: string; payload: any }) {
  const userSet = connections.get(userId);
  if (!userSet || userSet.size === 0) {
    return;
  }

  const payloadStr = JSON.stringify(event);

  for (const controller of userSet) {
    controller
      .writeSSE({
        event: event.type,
        data: payloadStr,
      })
      .catch((err) => {
        console.error(`[SSE] Push failed for user ${userId}, unregistering controller:`, err);
        unregisterConnection(userId, controller);
      });
  }
}
