import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export function KakaoCallbackScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.brandMark}>
        <Text style={styles.brandMarkText}>M</Text>
      </View>
      <ActivityIndicator color="#7D8D62" size="large" />
      <Text style={styles.title}>카카오 로그인을 연결하고 있어요</Text>
      <Text style={styles.description}>잠시만 기다리면 MoveOn으로 돌아갈게요.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F1E7' },
  brandMark: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5EBD6', marginBottom: 24 },
  brandMarkText: { color: '#68754F', fontSize: 19, fontWeight: '900' },
  title: { color: '#3F352D', fontSize: 17, fontWeight: '900', marginTop: 20 },
  description: { color: '#8C7F70', fontSize: 11, marginTop: 8 },
});
