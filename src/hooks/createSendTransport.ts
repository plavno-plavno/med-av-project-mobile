import * as mediasoupClient from 'mediasoup-client';
import { getMediasoupSocket } from './mediasoupSocketInstanceInit';


export const createSendTransport = async (
  device: mediasoupClient.types.Device,
  onTransportReady: (transport: mediasoupClient.types.Transport) => void,
  onError: (err: string) => void,
) => {
  const socket = getMediasoupSocket();

  if (!socket) {
    onError('Mediasoup socket is not connected');

    return;
  }

  socket.emit('createTransport');

  socket.once('createSendTransport', async (params) => {
    try {
      const transport = device.createSendTransport(params);

      transport.on('connect', ({ dtlsParameters }, callback, errback) => {
        // eslint-disable-next-line no-console
        console.log('[Mediasoup] Transport connect event');
        socket.emit('connectTransport', transport.id, dtlsParameters);
        callback();
      });

      transport.on('produce', ({ kind, rtpParameters }, callback, errback) => {
        // eslint-disable-next-line no-console
        console.log('[Mediasoup] Transport produce event');
        socket.emit(
          'registerProducer',
          {
            transportId: transport.id,
            kind,
            rtpParameters,
          },
          (producerId: any) => {
            callback({ id: producerId });
          },
        );
      });

      onTransportReady(transport);
    } catch (error: any) {
      console.error('[Mediasoup] Error creating send transport:', error);
      onError(error.message);
    }
  });
};
