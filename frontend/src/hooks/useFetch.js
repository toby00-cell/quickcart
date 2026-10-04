import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../api/client';

// useFetch(() => api call returning data, [deps]) -> { data, loading, error, reload }
export default function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const counter = useRef(0);

  const run = useCallback(async (silent = false) => {
    const id = ++counter.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const data = await fnRef.current();
      if (id === counter.current) setState({ data, loading: false, error: '' });
    } catch (err) {
      if (id === counter.current) setState({ data: null, loading: false, error: getErrorMessage(err) });
    }
  }, []);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: () => run(), setData: (data) => setState((s) => ({ ...s, data })) };
}
