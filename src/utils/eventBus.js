const target = new EventTarget();

export const eventBus = {
  on(type, listener) {
    target.addEventListener(type, listener);
    return () => target.removeEventListener(type, listener);
  },
  emit(type, detail = {}) {
    target.dispatchEvent(new CustomEvent(type, { detail }));
  }
};
