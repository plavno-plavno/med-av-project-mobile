import Clipboard from '@react-native-clipboard/clipboard';
import { t } from "i18next";
import Toast from "react-native-toast-message";

export const copyToClipboard =
  (value: string) => {
    Clipboard.setString(value);
    Toast.show({
      type: "success",
      text1: t("LinkCopied"),
    })
  };

export const fetchCopiedText = async () => {
  return await Clipboard.getString();
};