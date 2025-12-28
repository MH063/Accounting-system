import mitt from 'mitt'

type Events = {
  'user-info-updated': void;
  'avatar-updated': string;
};

const emitter = mitt<Events>()

export default emitter
