import * as Location from 'expo-location';
import { Location as LocationType } from '../types';

class LocationService {
  private async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Location permission request error:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationType | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      const address = await this.reverseGeocode(
        location.coords.latitude,
        location.coords.longitude
      );

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address?.formattedAddress,
        city: address?.city,
        country: address?.country,
      };
    } catch (error) {
      console.error('Get current location error:', error);
      return null;
    }
  }

  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<{
    formattedAddress: string;
    city: string;
    country: string;
  } | null> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length > 0) {
        const result = results[0];
        return {
          formattedAddress: [
            result.street,
            result.city,
            result.region,
            result.country,
          ]
            .filter(Boolean)
            .join(', '),
          city: result.city || '',
          country: result.country || '',
        };
      }

      return null;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return null;
    }
  }

  async geocodeAddress(address: string): Promise<LocationType | null> {
    try {
      const results = await Location.geocodeAsync(address);
      
      if (results.length > 0) {
        const result = results[0];
        return {
          latitude: result.latitude,
          longitude: result.longitude,
          address,
        };
      }

      return null;
    } catch (error) {
      console.error('Geocode address error:', error);
      return null;
    }
  }

  async watchLocation(
    callback: (location: LocationType) => void
  ): Promise<() => void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 10,
        },
        async (location) => {
          const address = await this.reverseGeocode(
            location.coords.latitude,
            location.coords.longitude
          );

          const locationData: LocationType = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            address: address?.formattedAddress,
            city: address?.city,
            country: address?.country,
          };

          callback(locationData);
        }
      );

      return () => subscription.remove();
    } catch (error) {
      console.error('Watch location error:', error);
      return () => {};
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async getLocationFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<LocationType> {
    const address = await this.reverseGeocode(latitude, longitude);
    
    return {
      latitude,
      longitude,
      address: address?.formattedAddress,
      city: address?.city,
      country: address?.country,
    };
  }
}

export const locationService = new LocationService();
export default locationService;
