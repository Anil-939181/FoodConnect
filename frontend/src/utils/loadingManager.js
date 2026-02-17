let counter = 0;
let subscribers = new Set();

function notify() {
  const isLoading = counter > 0;
  subscribers.forEach((cb) => cb(isLoading));
}

export function show() {
  counter += 1;
  notify();
}

export function hide() {
  counter = Math.max(0, counter - 1);
  notify();
}

export function subscribe(cb) {
  subscribers.add(cb);
  // send current state immediately
  cb(counter > 0);
  return () => subscribers.delete(cb);
}

export function reset() {
  counter = 0;
  notify();
}
