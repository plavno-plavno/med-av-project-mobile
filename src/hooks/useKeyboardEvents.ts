import { useEffect, useState } from "react";
import { Keyboard, KeyboardEvent } from "react-native";

const useKeyboardEvents = () => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const onKeyboardWillShow = (e: KeyboardEvent) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    };

    const onKeyboardWillHide = () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    };

    const showListener = Keyboard.addListener('keyboardDidShow', onKeyboardWillShow);
    const hideListener = Keyboard.addListener("keyboardDidHide", onKeyboardWillHide);

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  return { isKeyboardVisible, keyboardHeight };
};

export default useKeyboardEvents;
