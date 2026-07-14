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
      equipment: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      grocery_list_item_sources: {
        Row: {
          base_unit_code: string
          created_at: string
          grocery_list_item_id: string
          ingredient_id: string
          quantity_base: number
          recipe_id: string | null
          weekly_meal_plan_item_id: string
        }
        Insert: {
          base_unit_code: string
          created_at?: string
          grocery_list_item_id: string
          ingredient_id: string
          quantity_base: number
          recipe_id?: string | null
          weekly_meal_plan_item_id: string
        }
        Update: {
          base_unit_code?: string
          created_at?: string
          grocery_list_item_id?: string
          ingredient_id?: string
          quantity_base?: number
          recipe_id?: string | null
          weekly_meal_plan_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grocery_list_item_sources_grocery_list_item_id_fkey"
            columns: ["grocery_list_item_id"]
            isOneToOne: false
            referencedRelation: "grocery_list_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_list_item_sources_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_list_item_sources_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_list_item_sources_weekly_meal_plan_item_id_fkey"
            columns: ["weekly_meal_plan_item_id"]
            isOneToOne: false
            referencedRelation: "weekly_meal_plan_items"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_list_items: {
        Row: {
          base_unit_code: string
          created_at: string
          custom_name: string | null
          effective_quantity_base: number
          estimated_total_cost: number | null
          estimated_unit_cost: number | null
          generated_quantity_base: number
          grocery_list_id: string
          id: string
          ingredient_id: string | null
          is_custom: boolean
          is_removed: boolean
          manual_adjustment_quantity_base: number
          updated_at: string
        }
        Insert: {
          base_unit_code: string
          created_at?: string
          custom_name?: string | null
          effective_quantity_base?: number
          estimated_total_cost?: number | null
          estimated_unit_cost?: number | null
          generated_quantity_base?: number
          grocery_list_id: string
          id?: string
          ingredient_id?: string | null
          is_custom?: boolean
          is_removed?: boolean
          manual_adjustment_quantity_base?: number
          updated_at?: string
        }
        Update: {
          base_unit_code?: string
          created_at?: string
          custom_name?: string | null
          effective_quantity_base?: number
          estimated_total_cost?: number | null
          estimated_unit_cost?: number | null
          generated_quantity_base?: number
          grocery_list_id?: string
          id?: string
          ingredient_id?: string | null
          is_custom?: boolean
          is_removed?: boolean
          manual_adjustment_quantity_base?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grocery_list_items_grocery_list_id_fkey"
            columns: ["grocery_list_id"]
            isOneToOne: false
            referencedRelation: "grocery_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_list_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_lists: {
        Row: {
          created_at: string
          currency_code: string | null
          estimated_total: number | null
          household_id: string
          id: string
          status: string
          updated_at: string
          weekly_meal_plan_id: string
        }
        Insert: {
          created_at?: string
          currency_code?: string | null
          estimated_total?: number | null
          household_id: string
          id?: string
          status?: string
          updated_at?: string
          weekly_meal_plan_id: string
        }
        Update: {
          created_at?: string
          currency_code?: string | null
          estimated_total?: number | null
          household_id?: string
          id?: string
          status?: string
          updated_at?: string
          weekly_meal_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grocery_lists_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_lists_weekly_meal_plan_id_fkey"
            columns: ["weekly_meal_plan_id"]
            isOneToOne: true
            referencedRelation: "weekly_meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      household_demographics: {
        Row: {
          created_at: string
          elderly_count: number
          household_id: string
          kids_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          elderly_count?: number
          household_id: string
          kids_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          elderly_count?: number
          household_id?: string
          kids_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_demographics_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: true
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_meal_preferences: {
        Row: {
          created_at: string
          default_slot_type_id: string | null
          household_id: string
          max_cook_minutes: number | null
          max_prep_minutes: number | null
          meal_category_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_slot_type_id?: string | null
          household_id: string
          max_cook_minutes?: number | null
          max_prep_minutes?: number | null
          meal_category_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_slot_type_id?: string | null
          household_id?: string
          max_cook_minutes?: number | null
          max_prep_minutes?: number | null
          meal_category_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_meal_preferences_default_slot_type_id_fkey"
            columns: ["default_slot_type_id"]
            isOneToOne: false
            referencedRelation: "meal_slot_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_meal_preferences_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_meal_preferences_meal_category_id_fkey"
            columns: ["meal_category_id"]
            isOneToOne: false
            referencedRelation: "meal_categories"
            referencedColumns: ["id"]
          },
        ]
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
      household_planning_preferences: {
        Row: {
          created_at: string
          default_max_cook_minutes: number | null
          household_id: string
          planning_notes: string | null
          planning_timezone: string
          preferred_grocery_delivery_day: number | null
          updated_at: string
          weekly_cooking_holiday: number | null
        }
        Insert: {
          created_at?: string
          default_max_cook_minutes?: number | null
          household_id: string
          planning_notes?: string | null
          planning_timezone?: string
          preferred_grocery_delivery_day?: number | null
          updated_at?: string
          weekly_cooking_holiday?: number | null
        }
        Update: {
          created_at?: string
          default_max_cook_minutes?: number | null
          household_id?: string
          planning_notes?: string | null
          planning_timezone?: string
          preferred_grocery_delivery_day?: number | null
          updated_at?: string
          weekly_cooking_holiday?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "household_planning_preferences_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: true
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
      ingredient_aliases: {
        Row: {
          created_at: string
          display_name: string
          id: string
          ingredient_id: string
          is_active: boolean
          locale: string | null
          normalized_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          ingredient_id: string
          is_active?: boolean
          locale?: string | null
          normalized_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          ingredient_id?: string
          is_active?: boolean
          locale?: string | null
          normalized_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_aliases_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_allergens: {
        Row: {
          allergen_code: string
          created_at: string
          ingredient_id: string
          updated_at: string
        }
        Insert: {
          allergen_code: string
          created_at?: string
          ingredient_id: string
          updated_at?: string
        }
        Update: {
          allergen_code?: string
          created_at?: string
          ingredient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_allergens_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_seasonalities: {
        Row: {
          availability_level: string
          created_at: string
          cuisine_region_id: string | null
          end_month: number
          id: string
          ingredient_id: string
          start_month: number
          updated_at: string
        }
        Insert: {
          availability_level?: string
          created_at?: string
          cuisine_region_id?: string | null
          end_month: number
          id?: string
          ingredient_id: string
          start_month: number
          updated_at?: string
        }
        Update: {
          availability_level?: string
          created_at?: string
          cuisine_region_id?: string | null
          end_month?: number
          id?: string
          ingredient_id?: string
          start_month?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_seasonalities_cuisine_region_id_fkey"
            columns: ["cuisine_region_id"]
            isOneToOne: false
            referencedRelation: "cuisine_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_seasonalities_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          cost_currency: string | null
          created_at: string
          default_unit_code: string | null
          estimated_unit_cost: number | null
          id: string
          ingredient_category: string | null
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          cost_currency?: string | null
          created_at?: string
          default_unit_code?: string | null
          estimated_unit_cost?: number | null
          id?: string
          ingredient_category?: string | null
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          cost_currency?: string | null
          created_at?: string
          default_unit_code?: string | null
          estimated_unit_cost?: number | null
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
      meal_plan_generation_explanations: {
        Row: {
          created_at: string
          explanation_code: string
          generation_run_id: string
          id: string
          message: string
          metadata: Json
        }
        Insert: {
          created_at?: string
          explanation_code: string
          generation_run_id: string
          id?: string
          message: string
          metadata?: Json
        }
        Update: {
          created_at?: string
          explanation_code?: string
          generation_run_id?: string
          id?: string
          message?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_generation_explanations_generation_run_id_fkey"
            columns: ["generation_run_id"]
            isOneToOne: false
            referencedRelation: "meal_plan_generation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_generation_runs: {
        Row: {
          created_at: string
          created_by: string | null
          generation_source: string
          household_id: string
          id: string
          input_snapshot: Json
          meal_plan_id: string
          output_snapshot: Json
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          generation_source?: string
          household_id: string
          id?: string
          input_snapshot?: Json
          meal_plan_id: string
          output_snapshot?: Json
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          generation_source?: string
          household_id?: string
          id?: string
          input_snapshot?: Json
          meal_plan_id?: string
          output_snapshot?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_generation_runs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_generation_runs_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_item_recipe_snapshots: {
        Row: {
          created_at: string
          ingredient_snapshot: Json
          meal_plan_item_id: string
          recipe_snapshot: Json
        }
        Insert: {
          created_at?: string
          ingredient_snapshot: Json
          meal_plan_item_id: string
          recipe_snapshot: Json
        }
        Update: {
          created_at?: string
          ingredient_snapshot?: Json
          meal_plan_item_id?: string
          recipe_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_item_recipe_snapshots_meal_plan_item_id_fkey"
            columns: ["meal_plan_item_id"]
            isOneToOne: true
            referencedRelation: "weekly_meal_plan_items"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_item_selection_explanations: {
        Row: {
          created_at: string
          explanation_code: string
          generation_run_id: string
          id: string
          meal_plan_item_id: string
          message: string
          metadata: Json
        }
        Insert: {
          created_at?: string
          explanation_code: string
          generation_run_id: string
          id?: string
          meal_plan_item_id: string
          message: string
          metadata?: Json
        }
        Update: {
          created_at?: string
          explanation_code?: string
          generation_run_id?: string
          id?: string
          meal_plan_item_id?: string
          message?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_item_selection_explanations_generation_run_id_fkey"
            columns: ["generation_run_id"]
            isOneToOne: false
            referencedRelation: "meal_plan_generation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_item_selection_explanations_meal_plan_item_id_fkey"
            columns: ["meal_plan_item_id"]
            isOneToOne: false
            referencedRelation: "weekly_meal_plan_items"
            referencedColumns: ["id"]
          },
        ]
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
      nutrients: {
        Row: {
          category: string
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          unit_code: string
          updated_at: string
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          unit_code: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          unit_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      pantry_items: {
        Row: {
          base_unit_code: string
          created_at: string
          expires_at: string | null
          household_id: string
          id: string
          ingredient_id: string
          quantity_base: number
          updated_at: string
        }
        Insert: {
          base_unit_code: string
          created_at?: string
          expires_at?: string | null
          household_id: string
          id?: string
          ingredient_id: string
          quantity_base: number
          updated_at?: string
        }
        Update: {
          base_unit_code?: string
          created_at?: string
          expires_at?: string | null
          household_id?: string
          id?: string
          ingredient_id?: string
          quantity_base?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pantry_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pantry_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_cuisine_preferences: {
        Row: {
          created_at: string
          cuisine_id: string
          cuisine_region_id: string | null
          priority: number
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cuisine_id: string
          cuisine_region_id?: string | null
          priority?: number
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cuisine_id?: string
          cuisine_region_id?: string | null
          priority?: number
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_cuisine_preferences_cuisine_id_fkey"
            columns: ["cuisine_id"]
            isOneToOne: false
            referencedRelation: "cuisines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_cuisine_preferences_cuisine_region_id_cuisine_id_fkey"
            columns: ["cuisine_region_id", "cuisine_id"]
            isOneToOne: false
            referencedRelation: "cuisine_regions"
            referencedColumns: ["id", "cuisine_id"]
          },
          {
            foreignKeyName: "profile_cuisine_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_meal_preferences: {
        Row: {
          created_at: string
          max_cook_minutes: number | null
          max_prep_minutes: number | null
          meal_category_id: string
          preference_notes: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          max_cook_minutes?: number | null
          max_prep_minutes?: number | null
          meal_category_id: string
          preference_notes?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          max_cook_minutes?: number | null
          max_prep_minutes?: number | null
          meal_category_id?: string
          preference_notes?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_meal_preferences_meal_category_id_fkey"
            columns: ["meal_category_id"]
            isOneToOne: false
            referencedRelation: "meal_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_meal_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_meal_routines: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          is_active: boolean
          meal_category_id: string
          meal_location: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          is_active?: boolean
          meal_category_id: string
          meal_location?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          is_active?: boolean
          meal_category_id?: string
          meal_location?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_meal_routines_meal_category_id_fkey"
            columns: ["meal_category_id"]
            isOneToOne: false
            referencedRelation: "meal_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_meal_routines_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_nutrition_targets: {
        Row: {
          carbohydrates_target_g: number | null
          created_at: string
          daily_calorie_target_kcal: number | null
          fat_target_g: number | null
          fiber_target_g: number | null
          profile_id: string
          protein_target_g: number | null
          target_source: string
          updated_at: string
        }
        Insert: {
          carbohydrates_target_g?: number | null
          created_at?: string
          daily_calorie_target_kcal?: number | null
          fat_target_g?: number | null
          fiber_target_g?: number | null
          profile_id: string
          protein_target_g?: number | null
          target_source?: string
          updated_at?: string
        }
        Update: {
          carbohydrates_target_g?: number | null
          created_at?: string
          daily_calorie_target_kcal?: number | null
          fat_target_g?: number | null
          fiber_target_g?: number | null
          profile_id?: string
          protein_target_g?: number | null
          target_source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_nutrition_targets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      recipe_diet_compatibilities: {
        Row: {
          created_at: string
          diet_type: string
          recipe_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diet_type: string
          recipe_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diet_type?: string
          recipe_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_diet_compatibilities_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_equipment_requirements: {
        Row: {
          created_at: string
          equipment_id: string
          is_required: boolean
          note: string | null
          recipe_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipment_id: string
          is_required?: boolean
          note?: string | null
          recipe_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipment_id?: string
          is_required?: boolean
          note?: string | null
          recipe_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_equipment_requirements_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_equipment_requirements_recipe_id_fkey"
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
      recipe_meal_categories: {
        Row: {
          created_at: string
          meal_category_id: string
          recipe_id: string
        }
        Insert: {
          created_at?: string
          meal_category_id: string
          recipe_id: string
        }
        Update: {
          created_at?: string
          meal_category_id?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_meal_categories_meal_category_id_fkey"
            columns: ["meal_category_id"]
            isOneToOne: false
            referencedRelation: "meal_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_meal_categories_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_nutrient_values: {
        Row: {
          amount: number
          created_at: string
          nutrient_id: string
          recipe_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          nutrient_id: string
          recipe_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          nutrient_id?: string
          recipe_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_nutrient_values_nutrient_id_fkey"
            columns: ["nutrient_id"]
            isOneToOne: false
            referencedRelation: "nutrients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_nutrient_values_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_quality_scores: {
        Row: {
          calculated_at: string
          components: Json
          recipe_id: string
          score: number
        }
        Insert: {
          calculated_at?: string
          components?: Json
          recipe_id: string
          score: number
        }
        Update: {
          calculated_at?: string
          components?: Json
          recipe_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_quality_scores_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: true
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_required_equipment: {
        Row: {
          created_at: string
          equipment_name: string
          recipe_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipment_name: string
          recipe_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipment_name?: string
          recipe_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_required_equipment_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_sources: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipe_step_media: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          id: string
          media_type: string
          recipe_step_id: string
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          media_type: string
          recipe_step_id: string
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          media_type?: string
          recipe_step_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_step_media_recipe_step_id_fkey"
            columns: ["recipe_step_id"]
            isOneToOne: false
            referencedRelation: "recipe_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_steps: {
        Row: {
          created_at: string
          estimated_duration_minutes: number | null
          id: string
          instruction: string
          recipe_id: string
          step_number: number
          tip: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_duration_minutes?: number | null
          id?: string
          instruction: string
          recipe_id: string
          step_number: number
          tip?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_duration_minutes?: number | null
          id?: string
          instruction?: string
          recipe_id?: string
          step_number?: number
          tip?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_tag_assignments: {
        Row: {
          created_at: string
          recipe_id: string
          tag_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          recipe_id: string
          tag_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          recipe_id?: string
          tag_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_tag_assignments_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "recipe_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_tags: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          calories_kcal: number | null
          carbohydrates_g: number | null
          cook_time_minutes: number | null
          cover_image_path: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string | null
          estimated_cost: number | null
          estimated_cost_calculated_at: string | null
          estimated_cost_currency: string | null
          fat_g: number | null
          fiber_g: number | null
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          nutrition_source: string | null
          nutrition_status: string
          nutrition_updated_at: string | null
          prep_time_minutes: number | null
          primary_cuisine_id: string | null
          primary_cuisine_region_id: string | null
          protein_g: number | null
          publication_status: string
          published_at: string | null
          quality_status: string
          servings: number | null
          slug: string | null
          sodium_mg: number | null
          source_id: string | null
          source_metadata: Json
          source_type: Database["public"]["Enums"]["recipe_source_type"]
          sugar_g: number | null
          total_time_minutes: number | null
          updated_at: string
          visibility: Database["public"]["Enums"]["recipe_visibility"]
        }
        Insert: {
          calories_kcal?: number | null
          carbohydrates_g?: number | null
          cook_time_minutes?: number | null
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_cost?: number | null
          estimated_cost_calculated_at?: string | null
          estimated_cost_currency?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          nutrition_source?: string | null
          nutrition_status?: string
          nutrition_updated_at?: string | null
          prep_time_minutes?: number | null
          primary_cuisine_id?: string | null
          primary_cuisine_region_id?: string | null
          protein_g?: number | null
          publication_status?: string
          published_at?: string | null
          quality_status?: string
          servings?: number | null
          slug?: string | null
          sodium_mg?: number | null
          source_id?: string | null
          source_metadata?: Json
          source_type?: Database["public"]["Enums"]["recipe_source_type"]
          sugar_g?: number | null
          total_time_minutes?: number | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["recipe_visibility"]
        }
        Update: {
          calories_kcal?: number | null
          carbohydrates_g?: number | null
          cook_time_minutes?: number | null
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_cost?: number | null
          estimated_cost_calculated_at?: string | null
          estimated_cost_currency?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          nutrition_source?: string | null
          nutrition_status?: string
          nutrition_updated_at?: string | null
          prep_time_minutes?: number | null
          primary_cuisine_id?: string | null
          primary_cuisine_region_id?: string | null
          protein_g?: number | null
          publication_status?: string
          published_at?: string | null
          quality_status?: string
          servings?: number | null
          slug?: string | null
          sodium_mg?: number | null
          source_id?: string | null
          source_metadata?: Json
          source_type?: Database["public"]["Enums"]["recipe_source_type"]
          sugar_g?: number | null
          total_time_minutes?: number | null
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
          {
            foreignKeyName: "recipes_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "recipe_sources"
            referencedColumns: ["id"]
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
          approved_at: string | null
          approved_by: string | null
          created_at: string
          generation_context: Json | null
          generation_source: string
          household_id: string
          id: string
          latest_generation_run_id: string | null
          status: string
          updated_at: string
          week_start_date: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          generation_context?: Json | null
          generation_source?: string
          household_id: string
          id?: string
          latest_generation_run_id?: string | null
          status?: string
          updated_at?: string
          week_start_date: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          generation_context?: Json | null
          generation_source?: string
          household_id?: string
          id?: string
          latest_generation_run_id?: string | null
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
          {
            foreignKeyName: "weekly_meal_plans_latest_generation_run_id_fkey"
            columns: ["latest_generation_run_id"]
            isOneToOne: false
            referencedRelation: "meal_plan_generation_runs"
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
      recalculate_recipe_estimated_cost: {
        Args: { target_recipe_id: string }
        Returns: undefined
      }
      recalculate_recipe_quality: {
        Args: { target_recipe_id: string }
        Returns: undefined
      }
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
