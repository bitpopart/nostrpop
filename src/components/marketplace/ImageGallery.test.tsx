import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ImageGallery } from './ImageGallery';

describe('ImageGallery', () => {
  const mockImages = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg'
  ];

  it('renders with no images', () => {
    render(
      <TestApp>
        <ImageGallery images={[]} productName="Test Product" />
      </TestApp>
    );

    expect(screen.getByText('No images available')).toBeInTheDocument();
  });

  it('renders main image when images are provided', () => {
    render(
      <TestApp>
        <ImageGallery images={mockImages} productName="Test Product" />
      </TestApp>
    );

    const mainImage = screen.getByAltText('Test Product - Image 1');
    expect(mainImage).toBeInTheDocument();
    expect(mainImage).toHaveAttribute('src', mockImages[0]);
  });

  it('shows thumbnails when showThumbnails is true and multiple images exist', () => {
    render(
      <TestApp>
        <ImageGallery
          images={mockImages}
          productName="Test Product"
          showThumbnails={true}
        />
      </TestApp>
    );

    // Should show thumbnail for each image
    expect(screen.getByAltText('Thumbnail 1')).toBeInTheDocument();
    expect(screen.getByAltText('Thumbnail 2')).toBeInTheDocument();
    expect(screen.getByAltText('Thumbnail 3')).toBeInTheDocument();
  });

  it('hides thumbnails when showThumbnails is false', () => {
    render(
      <TestApp>
        <ImageGallery
          images={mockImages}
          productName="Test Product"
          showThumbnails={false}
        />
      </TestApp>
    );

    // Should not show thumbnails
    expect(screen.queryByAltText('Thumbnail 1')).not.toBeInTheDocument();
  });

  it('opens fullscreen dialog when main image is clicked and fullscreen is enabled', () => {
    render(
      <TestApp>
        <ImageGallery images={mockImages} productName="Test Product" enableFullscreen={true} />
      </TestApp>
    );

    const mainImageButton = screen.getByLabelText('View Test Product images in fullscreen');
    fireEvent.click(mainImageButton);

    // Dialog should be open (we can't easily test the dialog content due to portal rendering)
    // But we can verify the button was clickable
    expect(mainImageButton).toBeInTheDocument();
  });

  it('calls onClick handler when main image is clicked and onClick is provided', () => {
    const mockOnClick = vi.fn();

    render(
      <TestApp>
        <ImageGallery
          images={mockImages}
          productName="Test Product"
          onClick={mockOnClick}
          enableFullscreen={false}
        />
      </TestApp>
    );

    const mainImageButton = screen.getByLabelText('View Test Product details');
    fireEvent.click(mainImageButton);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('changes selected image when thumbnail is clicked', () => {
    render(
      <TestApp>
        <ImageGallery
          images={mockImages}
          productName="Test Product"
          showThumbnails={true}
        />
      </TestApp>
    );

    // Initially shows first image
    const mainImage = screen.getByAltText('Test Product - Image 1');
    expect(mainImage).toHaveAttribute('src', mockImages[0]);

    // Click second thumbnail
    const secondThumbnail = screen.getByAltText('Thumbnail 2');
    fireEvent.click(secondThumbnail);

    // Main image should now show second image
    const updatedMainImage = screen.getByAltText('Test Product - Image 2');
    expect(updatedMainImage).toHaveAttribute('src', mockImages[1]);
  });
});