# BitPop Cards Marketplace NIP

## Summary

This document describes the custom Nostr marketplace implementation for BitPop Cards, built on top of existing Nostr standards (NIP-15 and NIP-99) with additional features for physical and digital product management.

## Motivation

The BitPop Cards platform requires a marketplace system that can handle both physical and digital products with admin-only access control. This implementation extends the standard NIP-15 marketplace specification to include enhanced metadata and file management capabilities.

## Specification

### Admin Access Control

The marketplace is restricted to a specific admin NPUB:
- **Admin NPUB**: `npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz`
- Only this pubkey can create, update, and manage marketplace products
- Public users can browse the marketplace (when implemented)

### Product Types

The marketplace supports two distinct product types:

#### 1. Physical Products (Kind 30018)

Physical products follow the NIP-15 specification with additional metadata:

```json
{
  "kind": 30018,
  "content": {
    "id": "<uuid>",
    "stall_id": "bitpop-main-stall",
    "name": "<product title>",
    "description": "<product description>",
    "images": ["<image_url>", ...],
    "currency": "<currency_code>",
    "price": <float>,
    "quantity": <int|null>,
    "specs": [
      ["type", "physical"],
      ["weight", "<weight>"],
      ["dimensions", "<dimensions>"]
    ],
    "shipping": [{
      "id": "default",
      "cost": <float>
    }]
  },
  "tags": [
    ["d", "<product_id>"],
    ["t", "<category>"],
    ["t", "physical"],
    ["title", "<product_title>"],
    ["price", "<price>", "<currency>"],
    ["alt", "Physical product: <title>"]
  ]
}
```

**Additional Physical Product Fields:**
- `weight`: Product weight for shipping calculations
- `dimensions`: Product dimensions (e.g., "20x15x5 cm")
- `shipping.cost`: Base shipping cost for the product

#### 2. Digital Products (Kind 30018)

Digital products extend NIP-15 with file management capabilities:

```json
{
  "kind": 30018,
  "content": {
    "id": "<uuid>",
    "stall_id": "bitpop-digital-stall",
    "name": "<product title>",
    "description": "<product description>",
    "images": ["<preview_image_url>", ...],
    "currency": "<currency_code>",
    "price": <float>,
    "quantity": null,
    "specs": [
      ["type", "digital"],
      ["download_limit", "<limit>"],
      ["license_type", "<license>"],
      ["file_count", "<count>"]
    ],
    "digital_files": ["<file_url>", ...]
  },
  "tags": [
    ["d", "<product_id>"],
    ["t", "<category>"],
    ["t", "digital"],
    ["title", "<product_title>"],
    ["price", "<price>", "<currency>"],
    ["alt", "Digital product: <title>"],
    ["file", "<file_url>"],
    ...
  ]
}
```

**Additional Digital Product Fields:**
- `digital_files`: Array of downloadable file URLs
- `download_limit`: Maximum number of downloads per purchase
- `license_type`: License terms (personal, commercial, extended, royalty-free)
- `file` tags: Each downloadable file is also tagged for discoverability

### File Storage

All files (images and digital products) are uploaded using:
- **Blossom servers** (NIP-B7) for decentralized file storage
- **NIP-94 compatible tags** for file metadata
- **Maximum file size**: 10MB per file
- **Supported formats**: Any file type for digital products, images for previews

### Categories

The marketplace supports a comprehensive category system including:
- Physical goods (Clothing, Electronics, Home & Garden, etc.)
- Digital products (Software, Media, Services, etc.)
- Professional services
- Subscription services

### Currency Support

Supported currencies:
- **USD** - US Dollar ($)
- **EUR** - Euro (€)
- **GBP** - British Pound (£)
- **BTC** - Bitcoin (₿)
- **SAT** - Satoshis (sats)

### Stall Configuration

The marketplace uses predefined stalls:
- **Physical Products**: `bitpop-main-stall`
- **Digital Products**: `bitpop-digital-stall`

### Event Publishing

All marketplace events include:
- **NIP-31 alt tags** for human-readable descriptions
- **Proper categorization** using `t` tags for relay-level filtering
- **Structured metadata** following NIP-15 standards
- **File references** using both content fields and tags

## Implementation Notes

### Admin Interface

The admin interface provides:
- **Tabbed product creation** (Physical/Digital)
- **File upload with drag-and-drop** support
- **Category selection** from predefined list
- **Currency selection** with symbol display
- **Form validation** and error handling
- **Upload progress** indicators

### Security

- **Admin-only access** enforced at the UI level
- **File size limits** to prevent abuse
- **Input validation** on all form fields
- **Secure file upload** through Blossom servers

### Future Enhancements

Planned features:
- **Public marketplace browsing** for non-admin users
- **Shopping cart** functionality
- **Order management** system
- **Payment integration** with Lightning Network
- **Customer support** messaging

## Compatibility

This implementation is compatible with:
- **NIP-15**: Nostr Marketplace standard
- **NIP-94**: File Metadata standard
- **NIP-B7**: Blossom file storage
- **NIP-31**: Alt tags for accessibility

## Example Usage

### Creating a Physical Product

1. Admin logs in with the specified NPUB
2. Navigates to Shop → Admin Panel → Physical tab
3. Fills in product details (title, description, category)
4. Uploads product images
5. Sets pricing and shipping information
6. Submits form to publish to Nostr network

### Creating a Digital Product

1. Admin logs in with the specified NPUB
2. Navigates to Shop → Admin Panel → Digital tab
3. Fills in product details
4. Uploads downloadable files and preview images
5. Sets pricing and license terms
6. Submits form to publish to Nostr network

## References

- [NIP-15: Nostr Marketplace](https://github.com/nostr-protocol/nips/blob/master/15.md)
- [NIP-94: File Metadata](https://github.com/nostr-protocol/nips/blob/master/94.md)
- [NIP-99: Classified Listings](https://github.com/nostr-protocol/nips/blob/master/99.md)
- [NIP-B7: Blossom](https://github.com/hzrd149/blossom)