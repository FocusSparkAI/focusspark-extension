import { useContext } from 'react';
import { FocusContext } from '../context/focusContextValue';

export const useFocus = () => useContext(FocusContext);
