import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import MultiStepForm from '../../components/forms/MultiStepForm';
import { useAuth } from '../../contexts/AuthContext';
import cameraService from '../../services/cameraService';
import locationService from '../../services/locationService';
import { ProfileSetupData, UserPreferences } from '../../types';
import hapticUtils from '../../utils/hapticUtils';

// Step components
const BasicInfoStep: React.FC<{
  data: any;
  onChange: (data: any) => void;
  errors: string[];
  onValidate: () => void;
  initialName?: string;
}> = ({ data, onChange, errors, onValidate, initialName }) => {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepDescription}>
        Let's start with your basic information. This will help personalize your experience.
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name *</Text>
        <TextInput
          style={[styles.textInput, errors.length > 0 && styles.textInputError]}
          value={data.name || initialName || ''}
          onChangeText={(text) => onChange({ name: text })}
          placeholder="Enter your full name"
          autoFocus
          autoCapitalize="words"
        />
        {errors.length > 0 && (
          <Text style={styles.errorText}>{errors[0]}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Bio</Text>
        <TextInput
          style={[styles.textArea, styles.textInput]}
          value={data.bio || ''}
          onChangeText={(text) => onChange({ bio: text })}
          placeholder="Tell us a bit about yourself..."
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={styles.charCount}>
          {(data.bio || '').length}/500
        </Text>
      </View>
    </View>
  );
};

const PhotoStep: React.FC<{
  data: any;
  onChange: (data: any) => void;
  errors: string[];
  onValidate: () => void;
}> = ({ data, onChange, errors, onValidate }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTakePhoto = async () => {
    try {
      setIsLoading(true);
      const photo = await cameraService.takePhoto();
      if (photo) {
        onChange({ profilePicture: photo.uri });
        await hapticUtils.success();
      }
    } catch (error) {
      console.error('Take photo error:', error);
      await hapticUtils.error();
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      setIsLoading(true);
      const photos = await cameraService.pickFromGallery(false);
      if (photos.length > 0) {
        onChange({ profilePicture: photos[0].uri });
        await hapticUtils.success();
      }
    } catch (error) {
      console.error('Pick from gallery error:', error);
      await hapticUtils.error();
      Alert.alert('Error', 'Failed to pick photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepDescription}>
        Add a profile picture to make your account more personal and recognizable.
      </Text>
      
      <View style={styles.photoSection}>
        {data.profilePicture ? (
          <View style={styles.photoPreview}>
            <Image
              source={{ uri: data.profilePicture }}
              style={styles.profilePhoto}
            />
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={handlePickFromGallery}
            >
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="person" size={64} color="#CCC" />
            <Text style={styles.photoPlaceholderText}>No photo selected</Text>
          </View>
        )}
        
        <View style={styles.photoActions}>
          <TouchableOpacity
            style={[styles.photoButton, isLoading && styles.photoButtonDisabled]}
            onPress={handleTakePhoto}
            disabled={isLoading}
          >
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.photoButtonText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.photoButton, styles.photoButtonSecondary, isLoading && styles.photoButtonDisabled]}
            onPress={handlePickFromGallery}
            disabled={isLoading}
          >
            <Ionicons name="images" size={24} color={Colors.light.tint} />
            <Text style={[styles.photoButtonText, styles.photoButtonTextSecondary]}>
              Choose from Gallery
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const LocationStep: React.FC<{
  data: any;
  onChange: (data: any) => void;
  errors: string[];
  onValidate: () => void;
}> = ({ data, onChange, errors, onValidate }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const location = await locationService.getCurrentLocation();
      if (location) {
        onChange({ location });
        await hapticUtils.success();
      } else {
        await hapticUtils.error();
        Alert.alert('Location Unavailable', 'Unable to get your current location.');
      }
    } catch (error) {
      console.error('Get location error:', error);
      await hapticUtils.error();
      Alert.alert('Location Error', 'Failed to get your location.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepDescription}>
        Share your location to discover notes from other users in your area and organize your own notes by place.
      </Text>
      
      <View style={styles.locationSection}>
        {data.location ? (
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={24} color={Colors.light.tint} />
            <View style={styles.locationDetails}>
              <Text style={styles.locationText}>
                {data.location.address || `${data.location.latitude.toFixed(4)}, ${data.location.longitude.toFixed(4)}`}
              </Text>
              {data.location.city && (
                <Text style={styles.locationCity}>{data.location.city}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.clearLocationButton}
              onPress={() => onChange({ location: null })}
            >
              <Ionicons name="close-circle" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.locationPlaceholder}>
            <Ionicons name="location-outline" size={48} color="#CCC" />
            <Text style={styles.locationPlaceholderText}>No location set</Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.locationButton, isLoading && styles.locationButtonDisabled]}
          onPress={handleGetCurrentLocation}
          disabled={isLoading}
        >
          <Ionicons name="locate" size={20} color="#fff" />
          <Text style={styles.locationButtonText}>
            {isLoading ? 'Getting Location...' : 'Use Current Location'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.locationNote}>
          You can always change this later in your profile settings.
        </Text>
      </View>
    </View>
  );
};

const PreferencesStep: React.FC<{
  data: any;
  onChange: (data: any) => void;
  errors: string[];
  onValidate: () => void;
}> = ({ data, onChange, errors, onValidate }) => {
  const defaultPreferences: UserPreferences = {
    theme: 'auto',
    notifications: true,
    publicNotes: false,
    locationSharing: true,
  };

  const preferences = data.preferences || defaultPreferences;

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    onChange({
      preferences: {
        ...preferences,
        [key]: value,
      },
    });
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepDescription}>
        Customize your app experience with these preferences. You can change them anytime.
      </Text>
      
      <View style={styles.preferencesSection}>
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Theme</Text>
            <Text style={styles.preferenceDescription}>
              Choose your preferred app appearance
            </Text>
          </View>
          <View style={styles.preferenceControl}>
            {(['light', 'dark', 'auto'] as const).map((theme) => (
              <TouchableOpacity
                key={theme}
                style={[
                  styles.themeOption,
                  preferences.theme === theme && styles.themeOptionActive,
                ]}
                onPress={() => updatePreference('theme', theme)}
              >
                <Text style={[
                  styles.themeOptionText,
                  preferences.theme === theme && styles.themeOptionTextActive,
                ]}>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Push Notifications</Text>
            <Text style={styles.preferenceDescription}>
              Get notified about social interactions
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              preferences.notifications && styles.toggleButtonActive,
            ]}
            onPress={() => updatePreference('notifications', !preferences.notifications)}
          >
            <View style={[
              styles.toggleThumb,
              preferences.notifications && styles.toggleThumbActive,
            ]} />
          </TouchableOpacity>
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Public Notes</Text>
            <Text style={styles.preferenceDescription}>
              Allow others to see your public notes
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              preferences.publicNotes && styles.toggleButtonActive,
            ]}
            onPress={() => updatePreference('publicNotes', !preferences.publicNotes)}
          >
            <View style={[
              styles.toggleThumb,
              preferences.publicNotes && styles.toggleThumbActive,
            ]} />
          </TouchableOpacity>
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Location Sharing</Text>
            <Text style={styles.preferenceDescription}>
              Share location in your notes
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              preferences.locationSharing && styles.toggleButtonActive,
            ]}
            onPress={() => updatePreference('locationSharing', !preferences.locationSharing)}
          >
            <View style={[
              styles.toggleThumb,
              preferences.locationSharing && styles.toggleThumbActive,
            ]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function ProfileSetupScreen() {
  const colorScheme = useColorScheme();
  const { register } = useAuth();
  const params = useLocalSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);

  useEffect(() => {
    if (params.registrationData) {
      try {
        const data = JSON.parse(params.registrationData as string);
        setRegistrationData(data);
      } catch (error) {
        console.error('Failed to parse registration data:', error);
        Alert.alert('Error', 'Invalid registration data. Please try registering again.');
        router.back();
      }
    }
  }, [params.registrationData]);

  const handleComplete = useCallback(async (data: ProfileSetupData) => {
    if (!registrationData) {
      Alert.alert('Error', 'Registration data not found. Please try registering again.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Complete the registration with profile data
      await register(registrationData.name, registrationData.email, registrationData.password);
      
      // Save profile data to user preferences (you can extend this to save to backend)
      console.log('Profile setup completed:', data);
      
      await hapticUtils.success();
      
      // Navigate to main app
      Alert.alert(
        'Profile Setup Complete!',
        'Your profile has been configured successfully.',
        [{ text: 'Continue', onPress: () => {
          // Navigate to main app - this will happen automatically via auth context
        }}]
      );
      
    } catch (error) {
      console.error('Profile setup error:', error);
      await hapticUtils.error();
      Alert.alert('Error', 'Failed to complete registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [registrationData, register]);

  const steps = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Tell us about yourself',
      component: (props: any) => <BasicInfoStep {...props} initialName={registrationData?.name} />,
      validation: (data: any) => {
        const errors: string[] = [];
        if (!data.name || data.name.trim().length < 2) {
          errors.push('Name must be at least 2 characters long');
        }
        return errors;
      },
    },
    {
      id: 'photo',
      title: 'Profile Photo',
      description: 'Add a profile picture',
      component: PhotoStep,
    },
    {
      id: 'location',
      title: 'Location',
      description: 'Set your location',
      component: LocationStep,
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Customize your experience',
      component: PreferencesStep,
    },
  ];

  if (!registrationData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Profile Setup</Text>
        <Text style={styles.subtitle}>Let's personalize your experience</Text>
      </View>

      <MultiStepForm
        steps={steps}
        onComplete={handleComplete}
        submitButtonText="Complete Setup"
        loading={isSubmitting}
        showProgress={true}
        allowBackNavigation={true}
      />
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
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  photoSection: {
    alignItems: 'center',
  },
  photoPreview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  changePhotoButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 20,
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  photoActions: {
    gap: 12,
    width: '100%',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    gap: 8,
  },
  photoButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  photoButtonDisabled: {
    opacity: 0.6,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoButtonTextSecondary: {
    color: Colors.light.tint,
  },
  locationSection: {
    alignItems: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  locationDetails: {
    flex: 1,
    marginLeft: 12,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  locationCity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clearLocationButton: {
    padding: 4,
  },
  locationPlaceholder: {
    alignItems: 'center',
    marginBottom: 24,
  },
  locationPlaceholderText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  preferencesSection: {
    gap: 20,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  preferenceControl: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  themeOptionActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  themeOptionTextActive: {
    color: '#fff',
  },
  toggleButton: {
    width: 50,
    height: 30,
    backgroundColor: '#E0E0E0',
    borderRadius: 15,
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    backgroundColor: '#fff',
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
});
