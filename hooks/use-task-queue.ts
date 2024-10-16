import { useEffect, useState } from "react";

export type TaskQueueListener = () => void;
export type TaskRunner<T, R = void> = (
  task: T,
  signal?: AbortSignal,
) => Promise<R>;

type PromisedTask<T, R = void> = {
  task: T;
  resolve: (result: R) => void;
  reject: (reason?: any) => void; // eslint-disable-line
  signal: AbortSignal;
};

type State<T, R = void> = {
  add: (newTask: T) => Promise<R>;
  resume: () => void;
  clear: () => void;
  currentTask: T | undefined;
  queuedTasks: T[];
  error: Error | undefined;
};

export class TaskQueue<T, R = void> {
  private _currentTask: PromisedTask<T, R> | undefined;
  private _queuedTasks: PromisedTask<T, R>[] = [];
  private _listeners: TaskQueueListener[] = [];
  private _error: Error | undefined;
  private _abortController: AbortController | undefined;
  private _onFinishedCallback: (() => void) | undefined;

  constructor(private run: TaskRunner<T, R>) { }

  onFinished = (callback: () => void) => {
    this._onFinishedCallback = callback;
  };

  listen = (listener: TaskQueueListener) => {
    this._listeners.push(listener);
  };

  unlisten = (listener: TaskQueueListener) => {
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  };

  add = (task: T) => {
    const abortController = new AbortController();
    return new Promise<R>((resolve, reject) => {
      this._queuedTasks.push({
        reject,
        resolve,
        task,
        signal: abortController.signal,
      });
      this.notify();
      this.check();
    });
  };

  resume = () => {
    if (this._error) {
      this._error = undefined;
      this._currentTask = undefined;
      this.notify();
      this.check();
    }
  };

  clear = () => {
    this._abortController?.abort();
    this._abortController = new AbortController();

    this._queuedTasks.forEach((task) => {
      task.reject();
    });

    this._queuedTasks = [];
    this._currentTask = undefined;
    this._error = undefined;

    this.notify();
  };

  private notify = () => {
    for (let i = this._listeners.length - 1; i >= 0; i--) {
      this._listeners[i]();
    }
  };

  private check = () => {
    if (this._queuedTasks.length && !this._currentTask && !this._error) {
      const { task, resolve, reject, signal } = (this._currentTask =
        this._queuedTasks.shift()!);
      this.notify();

      this.run(task, signal)
        .then((result) => {
          this._currentTask = undefined;
          resolve(result);
        })
        .catch((err) => {
          this._error = err instanceof Error ? err : new Error("" + err);
          reject(this._error);
        })
        .finally(() => {
          this.notify();
          this.check();
        });
    } else if (!this._queuedTasks.length && !this._currentTask) {
      // If no more tasks are left, call the onFinished callback
      this._onFinishedCallback?.();
    }
  };

  get currentTask(): T | undefined {
    return this._currentTask?.task;
  }

  get queuedTasks(): T[] {
    return this._queuedTasks.map((t) => t.task);
  }

  get error(): Error | undefined {
    return this._error;
  }
}

export const useTaskQueue = <T, R = void>(
  queue: TaskQueue<T, R>,
): State<T, R> & { onFinished: (callback: () => void) => void } => {
  const [state, setState] = useState<State<T, R>>({
    add: queue.add,
    resume: queue.resume,
    clear: queue.clear,
    currentTask: queue.currentTask,
    queuedTasks: queue.queuedTasks,
    error: queue.error,
  });

  useEffect(() => {
    const update = () => {
      setState({
        add: queue.add,
        resume: queue.resume,
        clear: queue.clear,
        currentTask: queue.currentTask,
        queuedTasks: queue.queuedTasks,
        error: queue.error,
      });
    };

    update();

    queue.listen(update);

    return () => {
      queue.unlisten(update);
    };
  }, [queue]);

  return {
    ...state,
    onFinished: queue.onFinished,
  };
};
