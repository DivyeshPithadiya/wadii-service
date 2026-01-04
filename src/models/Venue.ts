import mongoose, { Schema, Document } from "mongoose";
import { IVenue } from "../types";

const venueSchema = new Schema<IVenue>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    venueName: {
      type: String,
      required: true,
      trim: true,
    },
    venueType: {
      type: String,
      enum: ["banquet", "lawn", "convention_center"],
      required: true,
    },
    capacity: {
      min: {
        type: Number,
        required: true,
        min: 1,
      },
      max: {
        type: Number,
        required: true,
        min: 1,
      },
    },
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
    },
    media: {
      coverImageUrl: {
        type: String,
        default: null,
      },
    },
    foodPackages: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        priceType: {
          type: String,
          enum: ["flat", "per_guest"],
          required: true,
        },
        inclusions: {
          type: [String],
          default: [],
          required: false, // or true if you want it mandatory
        },
        menuSections: [
          {
            sectionName: {
              type: String,
              required: true,
              trim: true,
            },
            selectionType: {
              type: String,
              enum: ["limit", "all_included"],
              required: true,
            },
            defaultPrice: {
              type: Number,
              required: false,
              default: 0,
            },
            maxSelectable: {
              type: Number,
              min: 1,
              required: function (this: any) {
                return this.selectionType === "limit";
              },
            },
          },
        ],
      },
    ],
    foodMenu: [
      {
        sectionName: {
          type: String,
          required: true,
          trim: true,
        },
        selectionType: {
          type: String,
          enum: ["free", "limit", "all_included"],
          required: true,
        },
        maxSelectable: {
          type: Number,
          min: 1,
          required: function (this: any) {
            return this.selectionType === "limit";
          },
        },
        items: [
          {
            name: {
              type: String,
              required: true,
              trim: true,
            },
            description: {
              type: String,
              trim: true,
            },
            isAvailable: {
              type: Boolean,
              default: true,
            },
            priceAdjustment: {
              type: Number,
              default: 0,
            },
          },
        ],
      },
    ],
    cateringServiceVendor: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        email: {
          type: String,
          required: true,
          trim: true,
          lowercase: true,
        },
        phone: {
          type: String,
          required: true,
          trim: true,
        },
        bankDetails: {
          type: {
            accountNumber: {
              type: String,
              required: false,
              trim: true,
            },
            accountHolderName: {
              type: String,
              required: false,
              trim: true,
            },
            ifscCode: {
              type: String,
              required: false,
              trim: true,
            },
            bankName: {
              type: String,
              required: false,
              trim: true,
            },
            branchName: {
              type: String,
              required: false,
              trim: true,
            },
            upiId: {
              type: String,
              required: false,
              trim: true,
            },
            _id: false,
          },
          required: false,
        },
      },
    ],
    services: [
      {
        service: {
          type: String,
          required: true,
          trim: true,
        },
        vendors: [
          {
            name: {
              type: String,
              required: true,
              trim: true,
            },
            email: {
              type: String,
              required: true,
              trim: true,
              lowercase: true,
            },
            phone: {
              type: String,
              required: true,
              trim: true,
            },
            bankDetails: {
              type: {
                accountNumber: {
                  type: String,
                  required: false,
                  trim: true,
                },
                accountHolderName: {
                  type: String,
                  required: false,
                  trim: true,
                },
                ifscCode: {
                  type: String,
                  required: false,
                  trim: true,
                },
                bankName: {
                  type: String,
                  required: false,
                  trim: true,
                },
                branchName: {
                  type: String,
                  required: false,
                  trim: true,
                },
                upiId: {
                  type: String,
                  required: false,
                  trim: true,
                },
                _id: false,
              },
              required: false,
            },
          },
        ],
        default: [],
      },
    ],
    bookingPreferences: {
      timings: {
        morning: {
          start: { type: String },
          end: { type: String },
        },
        evening: {
          start: { type: String },
          end: { type: String },
        },
        fullDay: {
          start: { type: String },
          end: { type: String },
        },
      },
      notes: { type: String, default: null },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      default: undefined,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
venueSchema.index({ businessId: 1 });
venueSchema.index({ status: 1 });
venueSchema.index({ venueType: 1 });
venueSchema.index({ createdAt: -1 });

// Validation: Ensure max capacity is greater than min capacity
venueSchema.pre("save", function (next) {
  if (this.capacity.max < this.capacity.min) {
    next(
      new Error(
        "Maximum capacity must be greater than or equal to minimum capacity"
      )
    );
  } else {
    next();
  }
});

// Validation: Food menu validation
venueSchema.pre("save", function (next) {
  if (this.foodMenu && this.foodMenu.length > 0) {
    for (const section of this.foodMenu) {
      // Validate maxSelectable for "limit" type
      if (section.selectionType === "limit" && !section.maxSelectable) {
        return next(
          new Error(
            `maxSelectable is required for section "${section.sectionName}" with selectionType "limit"`
          )
        );
      }

      // Validate items is array
      if (!Array.isArray(section.items)) {
        return next(
          new Error(
            `Items must be an array for section "${section.sectionName}"`
          )
        );
      }

      // Validate unique item names within section
      const itemNames = section.items.map((item: any) =>
        item.name.toLowerCase()
      );
      const uniqueNames = new Set(itemNames);
      if (itemNames.length !== uniqueNames.size) {
        return next(
          new Error(
            `Duplicate item names found in section "${section.sectionName}"`
          )
        );
      }
    }
  }
  next();
});

// Validation: Food package menuSections must reference valid foodMenu sections
venueSchema.pre("save", function (next) {
  if (this.foodPackages && this.foodPackages.length > 0) {
    // Get all available foodMenu section names
    const availableSections = new Set(
      (this.foodMenu || []).map((section: any) => section.sectionName)
    );

    for (const pkg of this.foodPackages) {
      if (pkg.menuSections && pkg.menuSections.length > 0) {
        // Check for unique section names within the package
        const sectionNames = pkg.menuSections.map((ms: any) => ms.sectionName);
        const uniqueSectionNames = new Set(sectionNames);
        if (sectionNames.length !== uniqueSectionNames.size) {
          return next(
            new Error(
              `Package "${pkg.name}" has duplicate menu section names. Each section must be unique within the package.`
            )
          );
        }

        for (const menuSection of pkg.menuSections) {
          // Validate that sectionName exists in foodMenu
          if (!availableSections.has(menuSection.sectionName)) {
            return next(
              new Error(
                `Package "${pkg.name}" references invalid menu section "${menuSection.sectionName}". Section does not exist in foodMenu.`
              )
            );
          }

          // Validate maxSelectable for "limit" type
          if (
            menuSection.selectionType === "limit" &&
            !menuSection.maxSelectable
          ) {
            return next(
              new Error(
                `maxSelectable is required for package "${pkg.name}" menuSection "${menuSection.sectionName}" with selectionType "limit"`
              )
            );
          }
        }
      }
    }
  }
  next();
});

export const Venue = mongoose.model<IVenue>("Venue", venueSchema);
