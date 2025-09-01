import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import permissionsService, { PermissionRequest } from '../../services/permissionsService';
import hapticUtils from '../../utils/hapticUtils';

export default function PermissionsScreen() {
  const colorScheme = useColorScheme();
  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingPermission, setUpdatingPermission] = useState<string | null>(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      const permissionRequests = await permissionsService.getPermissionRequests();
      setPermissions(permissionRequests);
    } catch (error) {
      console.error('Load permissions error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionRequest = useCallback(async (permissionName: string) => {
    try {
      setUpdatingPermission(permissionName);
      
      const granted = await permissionsService.requestPermission(permissionName);
      
      if (granted) {
        await hapticUtils.permissionGranted();
        Alert.alert(
          'Permission Granted!',
          `${permissionName} permission has been granted.`,
          [{ text: 'Great!' }]
        );
      } else {
        await hapticUtils.permissionDenied();
        Alert.alert(
          'Permission Denied',
          `${permissionName} permission was denied. Some features may not work properly.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: () => handlePermissionRequest(permissionName) },
          ]
        );
      }
      
      // Reload permissions to update UI
      await loadPermissions();
      
    } catch (error) {
      console.error('Request permission error:', error);
      await hapticUtils.error();
      Alert.alert('Error', 'Failed to request permission. Please try again.');
    } finally {
      setUpdatingPermission(null);
    }
  }, []);

  const showPermissionDetails = useCallback((permissionName: string) => {
    const explanation = permissionsService.getPermissionExplanation(permissionName);
    const benefits = permissionsService.getPermissionBenefits(permissionName);
    
    Alert.alert(
      `${permissionName} Permission`,
      explanation,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Learn More', onPress: () => showPermissionBenefits(permissionName, benefits) },
      ]
    );
  }, []);

  const showPermissionBenefits = useCallback((permissionName: string, benefits: string[]) => {
    Alert.alert(
      `Benefits of ${permissionName} Permission`,
      benefits.join('\n\n• '),
      [
        { text: 'Got It' },
        { text: 'Request Permission', onPress: () => handlePermissionRequest(permissionName) },
      ]
    );
  }, [handlePermissionRequest]);

  const renderPermissionItem = useCallback((permission: PermissionRequest) => {
    const isUpdating = updatingPermission === permission.name;
    
    return (
      <View key={permission.name} style={styles.permissionItem}>
        <View style={styles.permissionHeader}>
          <View style={styles.permissionIcon}>
            <Text style={styles.permissionIconText}>{permission.icon}</Text>
          </View>
          
          <View style={styles.permissionInfo}>
            <Text style={styles.permissionName}>{permission.name}</Text>
            <Text style={styles.permissionDescription}>{permission.description}</Text>
          </View>
          
          <View style={styles.permissionStatus}>
            {permission.isGranted ? (
              <View style={styles.statusGranted}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.statusTextGranted}>Granted</Text>
              </View>
            ) : (
              <View style={styles.statusDenied}>
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
                <Text style={styles.statusTextDenied}>Denied</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.permissionActions}>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => showPermissionDetails(permission.name)}
          >
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.infoButtonText}>Learn More</Text>
          </TouchableOpacity>
          
          {!permission.isGranted && (
            <TouchableOpacity
              style={[
                styles.requestButton,
                isUpdating && styles.requestButtonDisabled,
              ]}
              onPress={() => handlePermissionRequest(permission.name)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
              )}
              <Text style={styles.requestButtonText}>
                {isUpdating ? 'Requesting...' : 'Request Permission'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [updatingPermission, showPermissionDetails, handlePermissionRequest]);

  const renderPermissionsSummary = () => {
    const grantedCount = permissions.filter(p => p.isGranted).length;
    const totalCount = permissions.length;
    const percentage = Math.round((grantedCount / totalCount) * 100);
    
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Permissions Overview</Text>
          <Text style={styles.summarySubtitle}>
            {grantedCount} of {totalCount} permissions granted
          </Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${percentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{percentage}%</Text>
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{grantedCount}</Text>
            <Text style={styles.statLabel}>Granted</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalCount - grantedCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={styles.title}>App Permissions</Text>
        <Text style={styles.subtitle}>
          Manage what this app can access on your device
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderPermissionsSummary()}
        
        <View style={styles.permissionsList}>
          <Text style={styles.sectionTitle}>Permission Details</Text>
          {permissions.map(renderPermissionItem)}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Permissions help the app provide you with the best possible experience. 
            You can change these settings anytime in your device settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  summaryContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.tint,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.tint,
    minWidth: 40,
    textAlign: 'right',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
  },
  permissionsList: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  permissionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  permissionIconText: {
    fontSize: 24,
  },
  permissionInfo: {
    flex: 1,
    marginRight: 16,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  permissionStatus: {
    alignItems: 'center',
  },
  statusGranted: {
    alignItems: 'center',
  },
  statusDenied: {
    alignItems: 'center',
  },
  statusTextGranted: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
    fontWeight: '500',
  },
  statusTextDenied: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 2,
    fontWeight: '500',
  },
  permissionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    gap: 6,
  },
  infoButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.tint,
    gap: 6,
  },
  requestButtonDisabled: {
    opacity: 0.6,
  },
  requestButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});
