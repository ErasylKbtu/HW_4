import reactHooks from 'eslint-plugin-react-hooks';

export default [{
  files: ['src/**/*.{js,jsx}'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
  plugins: { 'react-hooks': reactHooks },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'no-restricted-imports': ['error', {
      paths: [{
        name: 'react',
        importNames: ['useRef', 'useMemo', 'useCallback', 'useReducer', 'useContext',
          'useLayoutEffect', 'useTransition', 'useDeferredValue', 'useId',
          'useSyncExternalStore', 'useImperativeHandle', 'useInsertionEffect',
          'useActionState', 'useOptimistic', 'useEffectEvent', 'use'],
        message: 'Homework 4 allows only useState and useEffect.',
      }],
    }],
  },
}, {
  files: ['src/**/*.jsx'],
  rules: {
    'no-restricted-syntax': ['error', {
      selector: 'Identifier[name="localStorage"]',
      message: 'Access localStorage only inside src/api/fakeApi.js.',
    }],
  },
}];
