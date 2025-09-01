import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Colors } from '../../../constants/Colors';
import locationService from '../../services/locationService';
import { Location } from '../../types';
import hapticUtils from '../../utils/hapticUtils';

interface LocationPickerProps {
  location?: Location;
  onLocationChange: (location: Location) => void;
  onLocationClear?: () => void;
  editable?: boolean;
  showMap?: boolean;
  placeholder?: string;
  required?: boolean;
  error?: string;
  touched?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DEFAULT_REGION: Region = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
  location,
  onLocationChange,
  onLocationClear,
  editable = true,
  showMap = true,
  placeholder = 'Select location',
  required = false,
  error,
  touched,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<Region>(DEFAULT_REGION);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(location || null);

  useEffect(() => {
    if (location) {
      setSelectedLocation(location);
      setCurrentRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [location]);

  const handleOpenModal = useCallback(async () => {
    if (!editable) return;
    
    setIsModalVisible(true);
    await hapticUtils.buttonPress();
    
    // Try to get current location if no location is selected
    if (!selectedLocation) {
      await getCurrentLocation();
    }
  }, [editable, selectedLocation]);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentLocation = await locationService.getCurrentLocation();
      
      if (currentLocation) {
        setSelectedLocation(currentLocation);
        setCurrentRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        await hapticUtils.success();
      } else {
        await hapticUtils.error();
        Alert.alert(
          'Location Unavailable',
          'Unable to get your current location. Please select a location manually on the map.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Get current location error:', error);
      await hapticUtils.error();
      Alert.alert(
        'Location Error',
        'Failed to get your current location. Please check your location permissions.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleMapPress = useCallback(async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    try {
      // Get address for the selected coordinates
      const locationData = await locationService.getLocationFromCoordinates(latitude, longitude);
      setSelectedLocation(locationData);
      await hapticUtils.locationSelection();
    } catch (error) {
      console.error('Get location from coordinates error:', error);
      // Fallback to coordinates only
      setSelectedLocation({
        latitude,
        longitude,
      });
      await hapticUtils.locationSelection();
    }
  }, []);

  const handleConfirmLocation = useCallback(async () => {
    if (!selectedLocation) {
      await hapticUtils.validationError();
      Alert.alert('No Location Selected', 'Please select a location on the map.');
      return;
    }

    onLocationChange(selectedLocation);
    await hapticUtils.success();
    handleCloseModal();
  }, [selectedLocation, onLocationChange, handleCloseModal]);

  const handleClearLocation = useCallback(async () => {
    if (onLocationClear) {
      onLocationClear();
      setSelectedLocation(null);
      await hapticUtils.buttonPress();
    }
  }, [onLocationClear]);

  const handleSearchLocation = useCallback(async () => {
    Alert.prompt(
      'Search Location',
      'Enter an address or place name:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Search',
          onPress: async (address) => {
            if (!address) return;
            
            try {
              setIsLoading(true);
              const locationData = await locationService.geocodeAddress(address);
               
              if (locationData) {
                setSelectedLocation(locationData);
                setCurrentRegion({
                  latitude: locationData.latitude,
                  longitude: locationData.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                });
                await hapticUtils.success();
              } else {
                await hapticUtils.error();
                Alert.alert('Location Not Found', 'Could not find the specified address.');
              }
            } catch (error) {
              console.error('Geocode address error:', error);
              await hapticUtils.error();
              Alert.alert('Search Error', 'Failed to search for the location.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      'plain-text'
    );
  }, []);

  const renderLocationDisplay = () => {
    if (!selectedLocation) {
      return (
        <View style={styles.placeholderContainer}>
          <Ionicons name="location-outline" size={20} color="#999" />
          <Text style={styles.placeholderText}>{placeholder}</Text>
          {required && <Text style={styles.required}> *</Text>}
        </View>
      );
    }

    return (
      <View style={styles.locationContainer}>
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={20} color={Colors.light.tint} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationText} numberOfLines={2}>
              {selectedLocation.address || `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`}
            </Text>
            {selectedLocation.city && (
              <Text style={styles.locationSubtext}>{selectedLocation.city}</Text>
            )}
          </View>
        </View>
        
        {editable && onLocationClear && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearLocation}
          >
            <Ionicons name="close-circle" size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderMapModal = () => {
    if (!showMap) return null;

    return (
      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseModal}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Select Location</Text>
            
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmLocation}
              disabled={!selectedLocation}
            >
              <Text style={[
                styles.confirmButtonText,
                !selectedLocation && styles.confirmButtonTextDisabled,
              ]}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={currentRegion}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={true}
            >
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                  title="Selected Location"
                  description={selectedLocation.address || 'Custom location'}
                  pinColor={Colors.light.tint}
                />
              )}
            </MapView>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={getCurrentLocation}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.light.tint} />
              ) : (
                <Ionicons name="locate" size={20} color={Colors.light.tint} />
              )}
              <Text style={styles.actionButtonText}>Current Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSearchLocation}
            >
              <Ionicons name="search" size={20} color={Colors.light.tint} />
              <Text style={styles.actionButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const hasError = touched && error;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.pickerContainer,
          hasError && styles.pickerContainerError,
          !editable && styles.pickerContainerDisabled,
        ]}
        onPress={handleOpenModal}
        disabled={!editable}
        activeOpacity={0.8}
      >
        {renderLocationDisplay()}
        
        {editable && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#999"
            style={styles.chevron}
          />
        )}
      </TouchableOpacity>

      {hasError && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {renderMapModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#fff',
    minHeight: 56,
    paddingHorizontal: 16,
  },
  pickerContainerError: {
    borderColor: '#FF3B30',
  },
  pickerContainerDisabled: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  placeholderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    marginLeft: 8,
  },
  required: {
    color: '#FF3B30',
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  locationSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clearButton: {
    padding: 4,
  },
  chevron: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 20,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButtonTextDisabled: {
    opacity: 0.6,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default LocationPicker;
