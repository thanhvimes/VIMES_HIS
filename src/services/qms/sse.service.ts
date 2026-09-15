import { Response } from 'express';

interface Client {
  id: string;
  res: Response;
}

const channels: Record<string, Client[]> = {};

/**
 * Broadcasts an event to a specific channel or globally.
 * @param data The event payload
 * @param channelId Optional. The areaId or 'global'
 */
export const broadcast = (data: any, channelId: string | number = 'global'): void => {
  // Normalize data for frontend call safety
  if (data.type === 'CALL_AGAIN' || data.type === 'NEW_CALL') {
    if (typeof data.ticket !== 'object' && data.ticket) {
      const ticketNum = data.ticket;
      data.ticket = {
        ticket_number: ticketNum,
        patient_name: data.patientName || 'Khách lẻ'
      };
      data.type = 'NEW_CALL';
    }
  }

  // If ALL (broadcast to all)
  if (channelId === 'ALL') {
    let totalClients = 0;
    Object.keys(channels).forEach(ch => {
      channels[ch].forEach(client => {
        try {
          client.res.write(`data: ${JSON.stringify(data)}\n\n`);
          totalClients++;
        } catch (e) {}
      });
    });
    console.log(`[Broadcast] Sending ${data.type} to ALL (${totalClients} clients)`);
    return;
  }

  const targetChannel = String(channelId);
  const clientsSent = new Set<string>();

  // 1. Send to target channel
  if (channels[targetChannel] && channels[targetChannel].length > 0) {
    console.log(`[Broadcast] Sending ${data.type} to channel [${targetChannel}] (${channels[targetChannel].length} clients)`);
    channels[targetChannel] = channels[targetChannel].filter(client => {
      try {
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
        clientsSent.add(client.id);
        return true;
      } catch (e: any) {
        console.error(`[Broadcast Error] Client ${client.id} disconnected:`, e.message);
        return false;
      }
    });
  }

  // 2. Propagation to global channel
  if (targetChannel !== 'global' && channels['global'] && channels['global'].length > 0) {
    console.log(`[Broadcast Global Propagation] Sending ${data.type} to channel [global] (${channels['global'].length} clients)`);
    channels['global'] = channels['global'].filter(client => {
      if (clientsSent.has(client.id)) return true; // Avoid duplicate sending
      try {
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
        return true;
      } catch (e: any) {
        console.error(`[Broadcast Error] Client ${client.id} disconnected from global:`, e.message);
        return false;
      }
    });
  }
};

/**
 * Adds a client to a specific channel.
 * @param res 
 * @param channelId 
 */
export const addClient = (res: Response, channelId: string | number = 'global'): { clientId: string; channelId: string } => {
  const clientId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
  const targetChannel = String(channelId);

  if (!channels[targetChannel]) {
    channels[targetChannel] = [];
  }

  channels[targetChannel].push({ id: clientId, res });
  console.log(`[SSE] Client ${clientId} subscribed to channel [${targetChannel}]`);
  return { clientId, channelId: targetChannel };
};

/**
 * Removes a client from a specific channel.
 * @param clientId 
 * @param channelId 
 */
export const removeClient = (clientId: string, channelId: string | number = 'global'): void => {
  const targetChannel = String(channelId);
  if (channels[targetChannel]) {
    channels[targetChannel] = channels[targetChannel].filter(c => c.id !== clientId);
    console.log(`[SSE] Client ${clientId} unsubscribed from channel [${targetChannel}]`);
    if (channels[targetChannel].length === 0) {
      delete channels[targetChannel];
    }
  }
};

// Gửi ping định kỳ 30 giây để giữ kết nối và tự động dọn dẹp client ngắt kết nối âm thầm
setInterval(() => {
  let totalCleaned = 0;
  Object.keys(channels).forEach(channelId => {
    channels[channelId] = channels[channelId].filter(client => {
      try {
        // SSE comment format (:) - gửi ping giữ kết nối
        client.res.write(':\n\n');
        return true;
      } catch (e: any) {
        console.log(`[SSE Heartbeat] Client ${client.id} disconnected, cleaning up.`);
        totalCleaned++;
        return false;
      }
    });
    if (channels[channelId].length === 0) {
      delete channels[channelId];
    }
  });
  if (totalCleaned > 0) {
    console.log(`[SSE Heartbeat] Cleaned up ${totalCleaned} dead connections.`);
  }
}, 30000);

