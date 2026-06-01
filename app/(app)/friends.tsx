import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from '@/services/friends';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { FriendItem } from '@/components/friends/FriendItem';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { Friend } from '@/types';
import { normalizeFriendCode } from '@/utils/code';

export default function FriendsScreen() {
  const { profile } = useAuth();
  const { friends, requests, loading } = useFriends(profile?.uid);
  const [addCode, setAddCode] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  async function handleAddFriend() {
    const code = normalizeFriendCode(addCode);
    if (code.length < 6) {
      setAddError('Enter a valid 6-character friend code.');
      return;
    }
    if (!profile) return;

    setAddError('');
    setAddLoading(true);
    try {
      const result = await sendFriendRequest(profile, code);
      if (result.success) {
        setAddCode('');
        Alert.alert('Request Sent', 'Your friend request has been sent!');
      } else {
        setAddError(result.error ?? 'Could not send request.');
      }
    } finally {
      setAddLoading(false);
    }
  }

  async function handleAccept(requestId: string) {
    if (!profile) return;
    try {
      await acceptFriendRequest(requestId, profile.uid);
    } catch {
      Alert.alert('Error', 'Could not accept request.');
    }
  }

  async function handleRemove(friend: Friend) {
    if (!profile) return;
    Alert.alert(
      'Remove Friend',
      `Remove ${friend.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFriend(profile.uid, friend.uid),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Friends</Text>

        {/* Add Friend */}
        <Card style={styles.addCard}>
          <Text style={styles.sectionTitle}>Add a Friend</Text>
          <View style={styles.addRow}>
            <Input
              value={addCode}
              onChangeText={(t) => {
                setAddCode(t.toUpperCase());
                setAddError('');
              }}
              placeholder="Friend code"
              maxLength={6}
              autoCapitalize="characters"
              style={styles.codeInput}
              error={addError}
            />
            <Button
              label="Add"
              onPress={handleAddFriend}
              loading={addLoading}
              size="md"
              style={styles.addBtn}
            />
          </View>
        </Card>

        {/* Incoming Requests */}
        {requests.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Friend Requests</Text>
            {requests.map((req) => (
              <Card key={req.id} style={styles.requestCard}>
                <Text style={styles.requestName}>{req.fromDisplayName}</Text>
                <Text style={styles.requestCode}>{req.fromFriendCode}</Text>
                <View style={styles.requestActions}>
                  <Button
                    label="Accept"
                    onPress={() => handleAccept(req.id)}
                    size="sm"
                    style={styles.acceptBtn}
                  />
                  <Button
                    label="Decline"
                    onPress={() => rejectFriendRequest(req.id)}
                    variant="ghost"
                    size="sm"
                  />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Friends List */}
        <View>
          <Text style={styles.sectionTitle}>
            My Friends ({friends.length})
          </Text>
          {loading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : friends.length === 0 ? (
            <Text style={styles.empty}>
              No friends yet. Add someone with their friend code.
            </Text>
          ) : (
            <Card>
              {friends.map((friend, index) => (
                <View key={friend.uid}>
                  {index > 0 && <View style={styles.divider} />}
                  <FriendItem
                    friend={friend}
                    onRemove={handleRemove}
                  />
                </View>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  addCard: { gap: Spacing.sm },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  codeInput: { flex: 1 },
  addBtn: {},
  requestCard: { gap: Spacing.sm, marginBottom: Spacing.sm },
  requestName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  requestCode: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  requestActions: { flexDirection: 'row', gap: Spacing.sm },
  acceptBtn: { flex: 1 },
  empty: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.xs,
  },
});
