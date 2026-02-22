let counter = 0;
let subscribers = new Set();
let currentType = 'default';

function notify() {
  const isLoading = counter > 0;
  subscribers.forEach((cb) => cb({ isLoading, type: currentType }));
}

export function show(options = {}) {
  if (counter === 0 || options.type === 'connecting') {
    currentType = options.type || 'default';
  }
  counter += 1;
  notify();
}

export function hide() {
  counter = Math.max(0, counter - 1);
  if (counter === 0) currentType = 'default';
  notify();
}

export function subscribe(cb) {
  subscribers.add(cb);
  cb({ isLoading: counter > 0, type: currentType });
  return () => subscribers.delete(cb);
}

export function reset() {
  counter = 0;
  currentType = 'default';
  notify();
}
