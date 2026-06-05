import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  BackHandler,
  Image,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { useSessionInvites } from '@/hooks/useSessionInvites';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from '@/services/friends';
import { respondToSessionInvite, joinSessionByCode } from '@/services/sessions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { FriendItem } from '@/components/friends/FriendItem';
import { AvatarDisplay } from '@/components/avatar/AvatarDisplay';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { F1Assets } from '@/constants/drivers';
import { AppLogo } from '@/components/ui/AppLogo';
import { Friend } from '@/types';
import { normalizeFriendCode } from '@/utils/code';

export default function FriendsScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { friends, requests, loading } = useFriends(profile?.uid);
  const { invites, loading: invitesLoading } = useSessionInvites(profile?.uid);
  const [addCode, setAddCode] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [inviteProcessing, setInviteProcessing] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/(app)');
        return true;
      });
      return () => sub.remove();
    }, [router])
  );

  async function handleAddFriend() {
    const code = normalizeFriendCode(addCode);
    if (code.length < 6) { setAddError('Enter a valid 6-character code.'); return; }
    if (!profile) return;
    setAddError('');
    setAddLoading(true);
    try {
      const result = await sendFriendRequest(profile, code);
      if (result.success) {
        setAddCode('');
        Alert.alert('Request Sent', 'Friend request sent!');
      } else {
        setAddError(result.error ?? 'Could not send request.');
      }
    } finally {
      setAddLoading(false);
    }
  }

  async function handleAccept(requestId: string) {
    if (!profile) return;
    try { await acceptFriendRequest(requestId, profile.uid); }
    catch { Alert.alert('Error', 'Could not accept request.'); }
  }

  async function handleInviteResponse(
    inviteId: string,
    joinCode: string,
    status: 'accepted' | 'declined'
  ) {
    setInviteProcessing(inviteId);
    try {
      if (status === 'accepted') {
        if (!user || !profile) return;
        const result = await joinSessionByCode(joinCode, user.uid, profile.displayName, profile.avatarId);
        if (!result.success || !result.sessionId) {
          await respondToSessionInvite(inviteId, 'declined');
          Alert.alert('Unavailable', result.error ?? 'Session ended.');
          return;
        }
        await respondToSessionInvite(inviteId, 'accepted');
        router.replace(`/(app)/session/${result.sessionId}`);
        return;
      }
      await respondToSessionInvite(inviteId, status);
    } catch {
      Alert.alert('Error', `Could not ${status} invite.`);
    } finally {
      setInviteProcessing(null);
    }
  }

  async function handleRemove(friend: Friend) {
    if (!profile) return;
    Alert.alert('Remove Driver', `Remove ${friend.displayName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFriend(profile.uid, friend.uid) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.headerBar}>
          <AppLogo size={40} />
          <Text style={styles.title}>FRIENDS</Text>
        </View>

        {/* Add Friend */}
        <Card style={styles.addCard}>
          <Text style={styles.sectionTitle}>ADD DRIVER</Text>
          <View style={styles.addRow}>
            <Input
              value={addCode}
              onChangeText={(t) => { setAddCode(t.toUpperCase()); setAddError(''); }}
              placeholder="Friend Code"
              maxLength={6}
              autoCapitalize="characters"
              containerStyle={styles.codeInput}
              error={addError}
            />
            <Button label="ADD" onPress={handleAddFriend} loading={addLoading} size="md" style={styles.addBtn} />
          </View>
        </Card>

        {/* Session Invites */}
        {(invites.length > 0 || invitesLoading) && (
          <View>
            <Text style={styles.sectionTitle}>RACE INVITES</Text>
            {invitesLoading
              ? <ActivityIndicator color={Colors.primary} />
              : invites.map((invite) => (
                <Card key={invite.id} style={styles.inviteCard}>
                  <View style={styles.inviteRow}>
                    <AvatarDisplay avatarId={invite.fromAvatarId} state="happy" size={48} animate={false} />
                    <View style={styles.inviteInfo}>
                      <Text style={styles.inviteName}>{invite.fromDisplayName}</Text>
                      <Text style={styles.inviteCode}>Code: {invite.joinCode}</Text>
                    </View>
                  </View>
                  <View style={styles.inviteActions}>
                    <Button
                      label="ACCEPT"
                      onPress={() => handleInviteResponse(invite.id, invite.joinCode, 'accepted')}
                      loading={inviteProcessing === invite.id}
                      size="sm"
                      style={styles.acceptBtn}
                    />
                    <Button
                      label="DECLINE"
                      onPress={() => handleInviteResponse(invite.id, invite.joinCode, 'declined')}
                      variant="ghost"
                      size="sm"
                    />
                  </View>
                </Card>
              ))
            }
          </View>
        )}

        {/* Friend Requests */}
        {requests.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>REQUESTS</Text>
            {requests.map((req) => (
              <Card key={req.id} style={styles.requestCard}>
                <View style={styles.requestRow}>
                  <AvatarDisplay avatarId={req.fromAvatarId} state="idle" size={44} animate={false} />
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>{req.fromDisplayName}</Text>
                    <Text style={styles.requestCode}>{req.fromFriendCode}</Text>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <Button label="Accept" onPress={() => handleAccept(req.id)} size="sm" style={styles.acceptBtn} />
                  <Button label="Decline" onPress={() => rejectFriendRequest(req.id)} variant="ghost" size="sm" />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Friends List */}
        <View>
          <Text style={styles.sectionTitle}>MY TEAM ({friends.length})</Text>
          {loading
            ? <ActivityIndicator color={Colors.primary} />
            : friends.length === 0
            ? <Text style={styles.empty}>No teammates yet. Add someone with their code.</Text>
            : <Card>
                {friends.map((friend, index) => (
                  <View key={friend.uid}>
                    {index > 0 && <View style={styles.divider} />}
                    <FriendItem friend={friend} onRemove={handleRemove} />
                  </View>
                ))}
              </Card>
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  headerBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  f1Logo: { width: 60, height: 22 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: 4 },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.black, color: Colors.textMuted, letterSpacing: 2, marginBottom: Spacing.sm },
  addCard: { gap: Spacing.sm },
  addRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  codeInput: { flex: 1 },
  addBtn: { marginTop: 24 },
  inviteCard: { gap: Spacing.sm, marginBottom: Spacing.sm },
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  inviteInfo: { flex: 1 },
  inviteName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  inviteCode: { fontSize: FontSize.xs, color: Colors.primary, letterSpacing: 2 },
  inviteActions: { flexDirection: 'row', gap: Spacing.sm },
  acceptBtn: { flex: 1 },
  requestCard: { gap: Spacing.sm, marginBottom: Spacing.sm },
  requestRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  requestInfo: { flex: 1 },
  requestName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  requestCode: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1 },
  requestActions: { flexDirection: 'row', gap: Spacing.sm },
  empty: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.xs },
});
