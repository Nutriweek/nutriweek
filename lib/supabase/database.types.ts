export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cuisine_regions: {
        Row: {
          country_code: string | null
          created_at: string
          cuisine_id: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          region_type: string
          slug: string
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          cuisine_id: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          region_type: string
          slug: string
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          cuisine_id?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          region_type?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuisine_regions_cuisine_id_fkey"
            columns: ["cuisine_id"]
            isOneToOne: false
            referencedRelation: "cuisines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuisine_regions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cuisine_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      cuisines: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      household_members: {
        Row: {
          created_at: string
          household_id: string
          role: Database["public"]["Enums"]["household_member_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          role?: Database["public"]["Enums"]["household_member_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          role?: Database["public"]["Enums"]["household_member_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          created_at: string
          default_unit_code: string | null
          id: string
          ingredient_category: string | null
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_unit_code?: string | null
          id?: string
          ingredient_category?: string | null
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_unit_code?: string | null
          id?: string
          ingredient_category?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      meal_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      meal_slot_types: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          requires_recipe: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          requires_recipe?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          requires_recipe?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          allergies: string[]
          city: string | null
          country: string | null
          created_at: string
          cuisine_preferences: string[]
          currency_code: string | null
          date_of_birth: string | null
          diet_type: string | null
          family_size: number | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          health_goal: Database["public"]["Enums"]["health_goal"] | null
          height_cm: number | null
          id: string
          kitchen_equipment: string[]
          meals_per_day: number | null
          state_province: string | null
          updated_at: string
          weekly_grocery_budget: number | null
          weight_kg: number | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          allergies?: string[]
          city?: string | null
          country?: string | null
          created_at?: string
          cuisine_preferences?: string[]
          currency_code?: string | null
          date_of_birth?: string | null
          diet_type?: string | null
          family_size?: number | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          health_goal?: Database["public"]["Enums"]["health_goal"] | null
          height_cm?: number | null
          id: string
          kitchen_equipment?: string[]
          meals_per_day?: number | null
          state_province?: string | null
          updated_at?: string
          weekly_grocery_budget?: number | null
          weight_kg?: number | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          allergies?: string[]
          city?: string | null
          country?: string | null
          created_at?: string
          cuisine_preferences?: string[]
          currency_code?: string | null
          date_of_birth?: string | null
          diet_type?: string | null
          family_size?: number | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          health_goal?: Database["public"]["Enums"]["health_goal"] | null
          height_cm?: number | null
          id?: string
          kitchen_equipment?: string[]
          meals_per_day?: number | null
          state_province?: string | null
          updated_at?: string
          weekly_grocery_budget?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      recipe_cuisines: {
        Row: {
          created_at: string
          cuisine_id: string
          cuisine_region_id: string | null
          recipe_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cuisine_id: string
          cuisine_region_id?: string | null
          recipe_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cuisine_id?: string
          cuisine_region_id?: string | null
          recipe_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_cuisines_cuisine_id_fkey"
            columns: ["cuisine_id"]
            isOneToOne: false
            referencedRelation: "cuisines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_cuisines_cuisine_region_id_cuisine_id_fkey"
            columns: ["cuisine_region_id", "cuisine_id"]
            isOneToOne: false
            referencedRelation: "cuisine_regions"
            referencedColumns: ["id", "cuisine_id"]
          },
          {
            foreignKeyName: "recipe_cuisines_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_household_access: {
        Row: {
          access_level: string
          created_at: string
          household_id: string
          recipe_id: string
          updated_at: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          household_id: string
          recipe_id: string
          updated_at?: string
        }
        Update: {
          access_level?: string
          created_at?: string
          household_id?: string
          recipe_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_household_access_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_household_access_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          base_quantity: number | null
          base_unit_code: string | null
          created_at: string
          display_order: number
          id: string
          ingredient_id: string
          is_optional: boolean
          preparation_note: string | null
          quantity: number
          recipe_id: string
          unit_code: string
          updated_at: string
        }
        Insert: {
          base_quantity?: number | null
          base_unit_code?: string | null
          created_at?: string
          display_order?: number
          id?: string
          ingredient_id: string
          is_optional?: boolean
          preparation_note?: string | null
          quantity: number
          recipe_id: string
          unit_code: string
          updated_at?: string
        }
        Update: {
          base_quantity?: number | null
          base_unit_code?: string | null
          created_at?: string
          display_order?: number
          id?: string
          ingredient_id?: string
          is_optional?: boolean
          preparation_note?: string | null
          quantity?: number
          recipe_id?: string
          unit_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          calories_kcal: number | null
          carbohydrates_g: number | null
          cook_time_minutes: number | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string | null
          fat_g: number | null
          fiber_g: number | null
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          prep_time_minutes: number | null
          primary_cuisine_id: string | null
          primary_cuisine_region_id: string | null
          protein_g: number | null
          published_at: string | null
          servings: number | null
          sodium_mg: number | null
          source_type: Database["public"]["Enums"]["recipe_source_type"]
          sugar_g: number | null
          updated_at: string
          visibility: Database["public"]["Enums"]["recipe_visibility"]
        }
        Insert: {
          calories_kcal?: number | null
          carbohydrates_g?: number | null
          cook_time_minutes?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          prep_time_minutes?: number | null
          primary_cuisine_id?: string | null
          primary_cuisine_region_id?: string | null
          protein_g?: number | null
          published_at?: string | null
          servings?: number | null
          sodium_mg?: number | null
          source_type?: Database["public"]["Enums"]["recipe_source_type"]
          sugar_g?: number | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["recipe_visibility"]
        }
        Update: {
          calories_kcal?: number | null
          carbohydrates_g?: number | null
          cook_time_minutes?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          prep_time_minutes?: number | null
          primary_cuisine_id?: string | null
          primary_cuisine_region_id?: string | null
          protein_g?: number | null
          published_at?: string | null
          servings?: number | null
          sodium_mg?: number | null
          source_type?: Database["public"]["Enums"]["recipe_source_type"]
          sugar_g?: number | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["recipe_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "recipes_primary_cuisine_id_fkey"
            columns: ["primary_cuisine_id"]
            isOneToOne: false
            referencedRelation: "cuisines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_primary_cuisine_region_id_primary_cuisine_id_fkey"
            columns: ["primary_cuisine_region_id", "primary_cuisine_id"]
            isOneToOne: false
            referencedRelation: "cuisine_regions"
            referencedColumns: ["id", "cuisine_id"]
          },
        ]
      }
      weekly_meal_plan_items: {
        Row: {
          created_at: string
          household_id: string
          id: string
          meal_category_id: string
          meal_date: string
          meal_plan_id: string
          meal_slot_type_id: string
          notes: string | null
          recipe_id: string | null
          servings: number | null
          slot_index: number
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          meal_category_id: string
          meal_date: string
          meal_plan_id: string
          meal_slot_type_id: string
          notes?: string | null
          recipe_id?: string | null
          servings?: number | null
          slot_index?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          meal_category_id?: string
          meal_date?: string
          meal_plan_id?: string
          meal_slot_type_id?: string
          notes?: string | null
          recipe_id?: string | null
          servings?: number | null
          slot_index?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_meal_plan_items_meal_category_id_fkey"
            columns: ["meal_category_id"]
            isOneToOne: false
            referencedRelation: "meal_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_meal_plan_items_meal_plan_id_household_id_fkey"
            columns: ["meal_plan_id", "household_id"]
            isOneToOne: false
            referencedRelation: "weekly_meal_plans"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "weekly_meal_plan_items_meal_slot_type_id_fkey"
            columns: ["meal_slot_type_id"]
            isOneToOne: false
            referencedRelation: "meal_slot_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_meal_plan_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_meal_plans: {
        Row: {
          created_at: string
          generation_context: Json | null
          generation_source: string
          household_id: string
          id: string
          status: string
          updated_at: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          generation_context?: Json | null
          generation_source?: string
          household_id: string
          id?: string
          status?: string
          updated_at?: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          generation_context?: Json | null
          generation_source?: string
          household_id?: string
          id?: string
          status?: string
          updated_at?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_meal_plans_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_initial_profile_and_household: {
        Args: { p_user_full_name?: string; p_user_id: string }
        Returns: undefined
      }
      is_household_member: {
        Args: { target_household_id: string }
        Returns: boolean
      }
      is_recipe_author: { Args: { target_recipe_id: string }; Returns: boolean }
    }
    Enums: {
      activity_level:
        | "sedentary"
        | "lightly_active"
        | "moderately_active"
        | "very_active"
      gender: "female" | "male" | "non_binary" | "other" | "prefer_not_to_say"
      health_goal: "lose_weight" | "maintain_weight" | "gain_muscle"
      household_member_role: "owner" | "member"
      recipe_source_type: "system" | "user" | "ai"
      recipe_visibility: "system" | "public" | "private"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_level: [
        "sedentary",
        "lightly_active",
        "moderately_active",
        "very_active",
      ],
      gender: ["female", "male", "non_binary", "other", "prefer_not_to_say"],
      health_goal: ["lose_weight", "maintain_weight", "gain_muscle"],
      household_member_role: ["owner", "member"],
      recipe_source_type: ["system", "user", "ai"],
      recipe_visibility: ["system", "public", "private"],
    },
  },
} as const
