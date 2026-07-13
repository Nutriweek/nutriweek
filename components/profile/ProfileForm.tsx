"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import ProfileField from "@/components/profile/ProfileField";
import ProfileSection from "@/components/profile/ProfileSection";
import MultiSelect from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ACTIVITY_LEVEL_OPTIONS,
  ALLERGY_OPTIONS,
  CUISINE_PREFERENCE_OPTIONS,
  DIET_TYPE_OPTIONS,
  GENDER_OPTIONS,
  HEALTH_GOAL_OPTIONS,
  KITCHEN_EQUIPMENT_OPTIONS,
  isAllergy,
  isCuisinePreference,
  isDietType,
  isKitchenEquipment,
} from "@/lib/profile/constants";
import { updateProfile } from "@/lib/profile/actions";
import { profileSchema, type ProfileFormValues } from "@/lib/profile/schemas";
import type { Profile } from "@/lib/profile/types";

type ProfileFormProps = {
  profile: Profile;
};

const inputClassName = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none";

function createMultiSelectOptions<T extends string>(values: readonly T[]) {
  return values.map((value) => ({ value, label: value }));
}

const allergyOptions = createMultiSelectOptions(ALLERGY_OPTIONS);
const cuisinePreferenceOptions = createMultiSelectOptions(CUISINE_PREFERENCE_OPTIONS);
const kitchenEquipmentOptions = createMultiSelectOptions(KITCHEN_EQUIPMENT_OPTIONS);

function dateValue(value: string | null) {
  return value ?? "";
}

function numberValue(value: number | null) {
  return value ?? null;
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [submitMessage, setSubmitMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name ?? "",
      date_of_birth: dateValue(profile.date_of_birth),
      gender: profile.gender ?? "",
      height_cm: numberValue(profile.height_cm),
      weight_kg: numberValue(profile.weight_kg),
      activity_level: profile.activity_level ?? "",
      health_goal: profile.health_goal ?? "",
      diet_type: profile.diet_type && isDietType(profile.diet_type) ? profile.diet_type : "",
      allergies: profile.allergies.filter(isAllergy),
      cuisine_preferences: profile.cuisine_preferences.filter(isCuisinePreference),
      meals_per_day: numberValue(profile.meals_per_day),
      family_size: numberValue(profile.family_size),
      weekly_grocery_budget: numberValue(profile.weekly_grocery_budget),
      currency_code: profile.currency_code?.trim() ?? "",
      country: profile.country ?? "",
      state_province: profile.state_province ?? "",
      city: profile.city ?? "",
      kitchen_equipment: profile.kitchen_equipment.filter(isKitchenEquipment),
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    setSubmitMessage(null);
    const result = await updateProfile(values);
    setSubmitMessage({ type: result.success ? "success" : "error", text: result.message });
  }

  const numericField = { setValueAs: (value: string) => (value === "" ? null : Number(value)) };

  return (
    <form className="space-y-6" noValidate onSubmit={handleSubmit(onSubmit)}>
      <ProfileSection title="Personal" description="Tell us a little about yourself.">
        <div className="grid gap-5 sm:grid-cols-2">
          <ProfileField label="Full name" htmlFor="full_name" error={errors.full_name?.message}>
            <input {...register("full_name")} id="full_name" autoComplete="name" className={inputClassName} aria-invalid={Boolean(errors.full_name)} aria-describedby={errors.full_name ? "full_name-error" : undefined} />
          </ProfileField>
          <ProfileField label="Date of birth" htmlFor="date_of_birth" error={errors.date_of_birth?.message}>
            <input {...register("date_of_birth")} id="date_of_birth" type="date" className={inputClassName} aria-invalid={Boolean(errors.date_of_birth)} aria-describedby={errors.date_of_birth ? "date_of_birth-error" : undefined} />
          </ProfileField>
          <ProfileField label="Gender" htmlFor="gender" error={errors.gender?.message}>
            <Controller name="gender" control={control} render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="gender" aria-invalid={Boolean(errors.gender)} aria-describedby={errors.gender ? "gender-error" : undefined}><SelectValue placeholder="Select an option" /></SelectTrigger>
                <SelectContent>{GENDER_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </ProfileField>
          <div className="grid grid-cols-2 gap-4">
            <ProfileField label="Height (cm)" htmlFor="height_cm" error={errors.height_cm?.message}>
              <input {...register("height_cm", numericField)} id="height_cm" type="number" min="1" step="0.01" className={inputClassName} aria-invalid={Boolean(errors.height_cm)} aria-describedby={errors.height_cm ? "height_cm-error" : undefined} />
            </ProfileField>
            <ProfileField label="Weight (kg)" htmlFor="weight_kg" error={errors.weight_kg?.message}>
              <input {...register("weight_kg", numericField)} id="weight_kg" type="number" min="1" step="0.01" className={inputClassName} aria-invalid={Boolean(errors.weight_kg)} aria-describedby={errors.weight_kg ? "weight_kg-error" : undefined} />
            </ProfileField>
          </div>
        </div>
      </ProfileSection>

      <ProfileSection title="Lifestyle and goals" description="These choices help tailor future meal planning.">
        <div className="grid gap-5 sm:grid-cols-3">
          <ProfileField label="Activity level" htmlFor="activity_level" error={errors.activity_level?.message}>
            <Controller name="activity_level" control={control} render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="activity_level" aria-invalid={Boolean(errors.activity_level)} aria-describedby={errors.activity_level ? "activity_level-error" : undefined}><SelectValue placeholder="Select an option" /></SelectTrigger>
                <SelectContent>{ACTIVITY_LEVEL_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </ProfileField>
          <ProfileField label="Goal" htmlFor="health_goal" error={errors.health_goal?.message}>
            <Controller name="health_goal" control={control} render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="health_goal" aria-invalid={Boolean(errors.health_goal)} aria-describedby={errors.health_goal ? "health_goal-error" : undefined}><SelectValue placeholder="Select an option" /></SelectTrigger>
                <SelectContent>{HEALTH_GOAL_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </ProfileField>
          <ProfileField label="Diet type" htmlFor="diet_type" error={errors.diet_type?.message}>
            <Controller name="diet_type" control={control} render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="diet_type" aria-invalid={Boolean(errors.diet_type)} aria-describedby={errors.diet_type ? "diet_type-error" : undefined}><SelectValue placeholder="Select an option" /></SelectTrigger>
                <SelectContent>{DIET_TYPE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </ProfileField>
        </div>
      </ProfileSection>

      <ProfileSection title="Diet preferences" description="Choose all that apply to your household planning.">
        <div className="grid gap-5 sm:grid-cols-2">
          <ProfileField label="Allergies" htmlFor="allergies" error={errors.allergies?.message}>
            <Controller name="allergies" control={control} render={({ field }) => <MultiSelect id="allergies" options={allergyOptions} value={field.value} onValueChange={field.onChange} placeholder="Select allergies" aria-invalid={Boolean(errors.allergies)} aria-describedby={errors.allergies ? "allergies-error" : undefined} />} />
          </ProfileField>
          <ProfileField label="Cuisine preferences" htmlFor="cuisine_preferences" error={errors.cuisine_preferences?.message}>
            <Controller name="cuisine_preferences" control={control} render={({ field }) => <MultiSelect id="cuisine_preferences" options={cuisinePreferenceOptions} value={field.value} onValueChange={field.onChange} placeholder="Select cuisine preferences" aria-invalid={Boolean(errors.cuisine_preferences)} aria-describedby={errors.cuisine_preferences ? "cuisine_preferences-error" : undefined} />} />
          </ProfileField>
        </div>
      </ProfileSection>

      <ProfileSection title="Planning" description="Set the basics for future weekly meal and grocery planning.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <ProfileField label="Meals per day" htmlFor="meals_per_day" error={errors.meals_per_day?.message}>
            <input {...register("meals_per_day", numericField)} id="meals_per_day" type="number" min="1" step="1" className={inputClassName} />
          </ProfileField>
          <ProfileField label="Family size" htmlFor="family_size" error={errors.family_size?.message}>
            <input {...register("family_size", numericField)} id="family_size" type="number" min="1" step="1" className={inputClassName} />
          </ProfileField>
          <ProfileField label="Weekly budget" htmlFor="weekly_grocery_budget" error={errors.weekly_grocery_budget?.message}>
            <input {...register("weekly_grocery_budget", numericField)} id="weekly_grocery_budget" type="number" min="0" step="0.01" className={inputClassName} />
          </ProfileField>
          <ProfileField label="Currency code" htmlFor="currency_code" error={errors.currency_code?.message}>
            <input {...register("currency_code")} id="currency_code" maxLength={3} placeholder="USD" className={inputClassName} />
          </ProfileField>
        </div>
      </ProfileSection>

      <ProfileSection title="Location" description="Your location will support local grocery planning in a future release.">
        <div className="grid gap-5 sm:grid-cols-3">
          <ProfileField label="Country" htmlFor="country" error={errors.country?.message}><input {...register("country")} id="country" autoComplete="country-name" className={inputClassName} /></ProfileField>
          <ProfileField label="State / Province" htmlFor="state_province" error={errors.state_province?.message}><input {...register("state_province")} id="state_province" autoComplete="address-level1" className={inputClassName} /></ProfileField>
          <ProfileField label="City" htmlFor="city" error={errors.city?.message}><input {...register("city")} id="city" autoComplete="address-level2" className={inputClassName} /></ProfileField>
        </div>
      </ProfileSection>

      <ProfileSection title="Kitchen equipment" description="Select the equipment available in your kitchen.">
        <ProfileField label="Available equipment" htmlFor="kitchen_equipment" error={errors.kitchen_equipment?.message}>
          <Controller name="kitchen_equipment" control={control} render={({ field }) => <MultiSelect id="kitchen_equipment" options={kitchenEquipmentOptions} value={field.value} onValueChange={field.onChange} placeholder="Select available equipment" aria-invalid={Boolean(errors.kitchen_equipment)} aria-describedby={errors.kitchen_equipment ? "kitchen_equipment-error" : undefined} />} />
        </ProfileField>
      </ProfileSection>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        {submitMessage ? (
          <p className={`flex items-center gap-2 text-sm ${submitMessage.type === "success" ? "text-emerald-400" : "text-rose-400"}`} role={submitMessage.type === "error" ? "alert" : "status"} aria-live="polite">
            {submitMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : null}
            {submitMessage.text}
          </p>
        ) : <span />}
        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100">
          {isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Save className="h-5 w-5" aria-hidden="true" />}
          {isSubmitting ? "Saving..." : "Save profile"}
        </button>
      </div>
    </form>
  );
}
