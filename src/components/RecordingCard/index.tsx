import { Icon } from "@components"
import { fontFamilies, fontWeights, helpers } from "@utils/theme"
import moment from "moment"
import { StyleSheet, Text, View } from "react-native"
import { moderateScale } from "react-native-size-matters"
import RNFetchBlob from "react-native-blob-util"
import {
  useRemoveRecordingsMutation,
} from "src/api/helpCenterApi/helpCenterApi"
import colors from "src/assets/colors"
import Share from "react-native-share"
import { isAndroid, isIOS } from "@utils/platformChecker"
import * as Keychain from "react-native-keychain"
import Config from "react-native-config"

const baseURL = Config.BASE_API_URL

const RecordingCard = ({
  id,
  title,
  duration,
  date,
}: {
  id: number
  title: string
  duration: string
  date?: string
}) => {
  const [removeRecordings] = useRemoveRecordingsMutation()
  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return [
      hours > 0 ? `${hours}h` : "",
      minutes > 0 ? `${minutes}m` : "",
      seconds > 0 ? `${seconds}s` : "",
    ]
      .filter(Boolean)
      .join(" ")
  }
  const formatDate = (isoString: string): string => {
    return moment(isoString).format("DD.MM.YYYY")
  }

  const onRecordDownload = async () => {
    try {
      const { dirs } = RNFetchBlob.fs;
      const dirToSave =
        isIOS() ? dirs.DocumentDir : dirs.DownloadDir;

      const configfb = {
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          mediaScannable: true,
          title: `${title}.mp4`,
          path: `${dirs.DownloadDir}/recording.mp4`,
          mime: 'video/mp4',
        },
        useDownloadManager: true,
        notification: true,
        mediaScannable: true,
        title: `${title}.mp4`,
        path: `${dirToSave}/${title}.mp4`,
      };

      const accessToken = await Keychain.getGenericPassword({
        service: "accessToken",
      });
      if (!accessToken) return;

      RNFetchBlob.config(configfb)
        .fetch("GET", `${baseURL}recordings/download/${id}`, {
          Authorization: `Bearer ${accessToken?.password}`,
        })
        .then((res) => {
          console.log("Download successful", res);

          if (isIOS()) {
            RNFetchBlob.fs.writeFile(configfb.path, res.data, "base64");
            RNFetchBlob.ios.previewDocument(configfb.path);
          }

          if (isAndroid()) {
            console.log("File downloaded to", res.path());
          }

          Share.open({
            url: `file://${res.path()}`,
            title: "Save or Share",
          }).catch((error: any) => {
            console.error("Error sharing file:", error);
          });
        })
        .catch((e) => {
          console.error("Download error:", e);
        });
    } catch (error: any) {
      console.error("Error saving file:", error?.message || error);
    }
  };

  const handleDownloadRecord = async () => {
    try {
      onRecordDownload()
    } catch (error) {
      console.log(error, 'error handleDownloadRecord');
    }
  }
  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Text style={styles.durationText}>
          {formatDuration(Number(duration) || 0)}
        </Text>
        <Text style={styles.timeText}>{formatDate(date || "")}</Text>
      </View>
      <View style={[helpers.flexRow, helpers.gap12]}>
        <Icon name="deleteAccount" onPress={() => removeRecordings({ id })} />
        <Icon name="download" onPress={handleDownloadRecord} />
      </View>
    </View>
  )
}

export default RecordingCard

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    boxShadow: "0px 0px 24px 0px rgba(46, 57, 70, 0.08)",
  },
  infoContainer: {
    flex: 1,
    gap: moderateScale(4),
  },
  title: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  durationText: {
    ...fontFamilies.interManropeRegular16,
    ...fontWeights.fontWeight400,
    color: colors.midGrey,
  },
  timeText: {
    ...fontFamilies.interManropeRegular14,
    ...fontWeights.fontWeight400,
    color: colors.cadetGrey,
  },
})
