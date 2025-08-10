# BitPop Card Categories Overview

## Categories Available in "Create New" Card Form

When users create new BitPop cards, they can choose from the following categories in the "Choose Category" dropdown. Each category has its own unique color, icon, and description.

### Current Available Categories (10 Default Categories)

| # | Icon | Category Name | Color | Description |
|---|------|---------------|-------|-------------|
| 1 | 🎂 | **Birthday** | #FF6B6B (Red) | Celebrate special birthdays with joy and happiness |
| 2 | 💕 | **Anniversary** | #4ECDC4 (Teal) | Commemorate special milestones and anniversaries |
| 3 | 🎄 | **Holiday** | #45B7D1 (Blue) | Seasonal greetings and holiday celebrations |
| 4 | 🙏 | **Thank You** | #96CEB4 (Green) | Express gratitude and appreciation |
| 5 | 🎉 | **Congratulations** | #FFEAA7 (Yellow) | Celebrate achievements and successes |
| 6 | 🌸 | **Get Well** | #DDA0DD (Plum) | Send healing thoughts and well wishes |
| 7 | ❤️ | **Love** | #FF69B4 (Hot Pink) | Express love and romantic feelings |
| 8 | 👫 | **Friendship** | #87CEEB (Sky Blue) | Celebrate friendship and companionship |
| 9 | 🕊️ | **Sympathy** | #B0C4DE (Light Steel Blue) | Offer comfort and condolences |
| 10 | 💼 | **Business** | #708090 (Slate Gray) | Professional and corporate communications |

## How Categories Work

### In the Create Form
- **All categories** (both visible and hidden) are available for card creation
- Categories appear in the dropdown with their icon, name, and colored badge
- When selected, a preview shows the category's icon, name, color, and description
- The form validates that a category must be selected before submission

### On the Cards Page (Browse/Filter)
- **Only visible categories** appear as filter buttons on the main cards page
- Each category button shows the category icon and name
- Categories are dynamically loaded from the category management system
- "All" option is always available to show cards from all categories
- Hidden categories won't appear in the filter but their cards are still accessible

### Category Management Features
- **Add New Categories**: Admins can create custom categories with:
  - Custom name and description
  - Custom color (hex color picker)
  - Custom emoji icon
  - Visibility toggle (show/hide in filters)
- **Edit Existing**: Modify any category properties except for default categories
- **Delete Custom**: Remove non-default categories
- **Visibility Control**: Toggle whether categories appear in page filters
- **Reset to Defaults**: Restore original 10 categories

### Category Properties
Each category includes:
- **ID**: Unique identifier (auto-generated from name)
- **Name**: Display name shown to users
- **Description**: Helpful text explaining the category's purpose
- **Color**: Hex color code for badges and styling
- **Icon**: Emoji character for visual identification
- **isDefault**: Whether it's a built-in category (cannot be deleted)
- **isVisible**: Whether it appears in filter dropdowns
- **Timestamps**: Created and updated dates

### Technical Implementation
- Categories are stored in local storage with the key `card-categories`
- Custom categories are published to Nostr using kind 30403 (addressable events)
- The `useCardCategories` hook provides access to all category data
- Categories use the `t` tag system for efficient relay-level filtering

## Accessing Category Management

### For Admins
1. **Navigation**: Categories link appears in the admin section of the navigation
2. **Direct URL**: Visit `/categories` to access the category demo and management
3. **Admin Dashboard**: Link available from the admin panel

### Demo Page Features
The `/categories` page includes three tabs:
1. **Available Categories**: Visual overview of all current categories
2. **Create New Card**: Live demo of the card creation form
3. **Category Management**: Full admin interface for managing categories

## Future Enhancements

The category system is designed to be extensible and can support:
- Category hierarchies (parent/child relationships)
- Category-specific templates or styling
- Usage analytics and popular category tracking
- Import/export of category configurations
- Community-driven category suggestions

---

*This overview shows the current state of the BitPop card category system. Categories can be dynamically added, modified, or removed through the admin interface.*