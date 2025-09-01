import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { NoteImage } from '../../types';
import hapticUtils from '../../utils/hapticUtils';

interface PhotoGalleryProps {
  images: NoteImage[];
  onImagePress?: (image: NoteImage, index: number) => void;
  onImageDelete?: (imageId: string) => void;
  onImageReorder?: (fromIndex: number, toIndex: number) => void;
  maxImages?: number;
  showAddButton?: boolean;
  onAddImage?: () => void;
  editable?: boolean;
  imageSize?: number;
  spacing?: number;
  columns?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  images,
  onImagePress,
  onImageDelete,
  onImageReorder,
  maxImages = 9,
  showAddButton = true,
  onAddImage,
  editable = true,
  imageSize = 100,
  spacing = 8,
  columns = 3,
}) => {
  const [selectedImage, setSelectedImage] = useState<NoteImage | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [longPressedImage, setLongPressedImage] = useState<string | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const canAddMore = images.length < maxImages;
  const actualImageSize = (screenWidth - (columns + 1) * spacing) / columns;

  const handleImagePress = useCallback(async (image: NoteImage, index: number) => {
    if (onImagePress) {
      onImagePress(image, index);
    } else {
      setSelectedImage(image);
      setSelectedImageIndex(index);
      setIsModalVisible(true);
    }
    await hapticUtils.photoSelection();
  }, [onImagePress]);

  const handleImageLongPress = useCallback(async (imageId: string) => {
    if (!editable) return;
    
    setLongPressedImage(imageId);
    await hapticUtils.longPress();
    
    Alert.alert(
      'Image Options',
      'What would you like to do with this image?',
      [
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteImage(imageId),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, [editable]);

  const handleDeleteImage = useCallback(async (imageId: string) => {
    if (onImageDelete) {
      onImageDelete(imageId);
      await hapticUtils.noteDeleted();
    }
  }, [onImageDelete]);

  const handleAddImage = useCallback(async () => {
    if (onAddImage) {
      onAddImage();
      await hapticUtils.buttonPress();
    }
  }, [onAddImage]);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setSelectedImage(null);
    setSelectedImageIndex(-1);
  }, []);

  const goToPreviousImage = useCallback(() => {
    if (selectedImageIndex > 0) {
      const newIndex = selectedImageIndex - 1;
      setSelectedImageIndex(newIndex);
      setSelectedImage(images[newIndex]);
    }
  }, [selectedImageIndex, images]);

  const goToNextImage = useCallback(() => {
    if (selectedImageIndex < images.length - 1) {
      const newIndex = selectedImageIndex + 1;
      setSelectedImageIndex(newIndex);
      setSelectedImage(images[newIndex]);
    }
  }, [selectedImageIndex, images]);

  const renderImage = useCallback((image: NoteImage, index: number) => {
    const isLongPressed = longPressedImage === image.id;
    
    return (
      <TouchableOpacity
        key={image.id}
        style={[
          styles.imageContainer,
          {
            width: actualImageSize,
            height: actualImageSize,
            marginBottom: spacing,
            marginRight: (index + 1) % columns === 0 ? 0 : spacing,
          },
        ]}
        onPress={() => handleImagePress(image, index)}
        onLongPress={() => handleImageLongPress(image.id)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: image.thumbnail || image.uri }}
          style={[
            styles.image,
            {
              width: actualImageSize,
              height: actualImageSize,
            },
          ]}
          resizeMode="cover"
        />
        
        {editable && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteImage(image.id)}
          >
            <Ionicons name="close-circle" size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}
        
        {image.metadata && (
          <View style={styles.imageInfo}>
            <Text style={styles.imageInfoText}>
              {new Date(image.metadata.timestamp).toLocaleDateString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [
    actualImageSize,
    spacing,
    columns,
    longPressedImage,
    editable,
    handleImagePress,
    handleImageLongPress,
    handleDeleteImage,
  ]);

  const renderAddButton = useCallback(() => {
    if (!showAddButton || !canAddMore) return null;

    return (
      <TouchableOpacity
        style={[
          styles.addButton,
          {
            width: actualImageSize,
            height: actualImageSize,
            marginBottom: spacing,
          },
        ]}
        onPress={handleAddImage}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#666" />
        <Text style={styles.addButtonText}>Add Photo</Text>
      </TouchableOpacity>
    );
  }, [showAddButton, canAddMore, actualImageSize, spacing, handleAddImage]);

  const renderImageModal = () => {
    if (!selectedImage) return null;

    return (
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={closeModal}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.modalContent}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.modalImage}
              resizeMode="contain"
            />
            
            {images.length > 1 && (
              <View style={styles.modalNavigation}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    selectedImageIndex === 0 && styles.navButtonDisabled,
                  ]}
                  onPress={goToPreviousImage}
                  disabled={selectedImageIndex === 0}
                >
                  <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                
                <Text style={styles.imageCounter}>
                  {selectedImageIndex + 1} / {images.length}
                </Text>
                
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    selectedImageIndex === images.length - 1 && styles.navButtonDisabled,
                  ]}
                  onPress={goToNextImage}
                  disabled={selectedImageIndex === images.length - 1}
                >
                  <Ionicons name="chevron-forward" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            
            {selectedImage.metadata && (
              <View style={styles.modalImageInfo}>
                <Text style={styles.modalImageInfoText}>
                  Taken: {new Date(selectedImage.metadata.timestamp).toLocaleString()}
                </Text>
                {selectedImage.metadata.location && (
                  <Text style={styles.modalImageInfoText}>
                    Location: {selectedImage.metadata.location.address || 'Unknown'}
                  </Text>
                )}
                <Text style={styles.modalImageInfoText}>
                  Size: {(selectedImage.metadata.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  if (images.length === 0 && !showAddButton) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={48} color="#CCC" />
        <Text style={styles.emptyText}>No photos yet</Text>
        <Text style={styles.emptySubtext}>Add photos to make your notes more visual</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {images.map(renderImage)}
        {renderAddButton()}
      </ScrollView>
      
      {renderImageModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  image: {
    borderRadius: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 2,
  },
  imageInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageInfoText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
  addButton: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  addButtonText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalImage: {
    width: screenWidth - 40,
    height: screenWidth - 40,
    borderRadius: 8,
  },
  modalNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  navButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  imageCounter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 20,
  },
  modalImageInfo: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 16,
  },
  modalImageInfoText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
});

export default PhotoGallery;
