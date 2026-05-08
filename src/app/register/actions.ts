"use server";

import { revalidatePath } from "next/cache";
import { leagueConfig } from "@/lib/league-config";
import { createSupabaseServerClient, createSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase-server";
import type { LmuClass } from "@/types/league";
import type { ApplicationActionState } from "./application-action-types";

const getText = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const getBool = (formData: FormData, key: string) => getText(formData, key) === "yes";

function validateApplication(formData: FormData) {
  const fieldErrors: Record<string, string> = {};
  const age = Number.parseInt(getText(formData, "age"), 10);
  const carNumber = Number.parseInt(getText(formData, "car_number"), 10);
  const preferredClass = getText(formData, "preferred_class") as LmuClass;
  const previousExperience = getBool(formData, "previous_league_experience");
  const hasTeammate = getBool(formData, "has_teammate");

  const requiredFields = [
    "display_name",
    "real_name",
    "country",
    "discord_username",
    "steam_id",
    "preferred_car",
    "safety_rank",
  ];

  for (const field of requiredFields) {
    if (!getText(formData, field)) fieldErrors[field] = "This field is required.";
  }

  if (!Number.isFinite(age) || age < 13 || age > 80) {
    fieldErrors.age = "Age must be a number between 13 and 80.";
  }

  if (!Number.isFinite(carNumber) || carNumber < 1 || carNumber > 999) {
    fieldErrors.car_number = "Car number must be between 1 and 999.";
  }

  if (!leagueConfig.supportedClasses.includes(preferredClass)) {
    fieldErrors.preferred_class = "Choose Hypercar, LMP2 or LMGT3.";
  }

  if (previousExperience && getText(formData, "previous_league_experience_details").length < 5) {
    fieldErrors.previous_league_experience_details = "Add a short summary of your previous league experience.";
  }

  if (hasTeammate && getText(formData, "teammate_info").length < 2) {
    fieldErrors.teammate_info = "Add your teammate/friend name or Discord.";
  }

  return {
    fieldErrors,
    values: {
      display_name: getText(formData, "display_name"),
      real_name: getText(formData, "real_name"),
      age,
      country: getText(formData, "country"),
      discord_username: getText(formData, "discord_username"),
      steam_id: getText(formData, "steam_id"),
      car_number: carNumber,
      preferred_class: preferredClass,
      preferred_car: getText(formData, "preferred_car"),
      safety_rank: getText(formData, "safety_rank"),
      previous_league_experience: previousExperience,
      previous_league_experience_details: getText(formData, "previous_league_experience_details") || null,
      has_teammate: hasTeammate,
      teammate_info: getText(formData, "teammate_info") || null,
      team_name: getText(formData, "team_name") || null,
    },
  };
}

export async function submitDriverApplication(
  _previousState: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: "Driver applications are not open yet.",
    };
  }

  const authClient = await createSupabaseServerClient();
  if (!authClient) return { ok: false, message: "Driver applications are temporarily unavailable." };

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return { ok: false, message: "Sign in before submitting a driver application." };
  }

  const serviceClient = createSupabaseServiceClient();

  if (!serviceClient) {
    return {
      ok: false,
      message: "Driver applications are temporarily unavailable.",
    };
  }

  const { data: existingUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingUser) {
    const { error: userError } = await serviceClient.from("users").insert({
      id: user.id,
      email: user.email ?? "",
      role: "viewer",
    });

    if (userError) return { ok: false, message: userError.message };
  }

  const { fieldErrors, values } = validateApplication(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Fix the highlighted fields before submitting.", fieldErrors };
  }

  const duplicateChecks = [
    serviceClient.from("drivers").select("id").eq("car_number", values.car_number).maybeSingle(),
    serviceClient.from("drivers").select("id").ilike("discord_username", values.discord_username).maybeSingle(),
    serviceClient.from("drivers").select("id").eq("steam_id", values.steam_id).maybeSingle(),
    serviceClient.from("driver_applications").select("id").eq("car_number", values.car_number).eq("status", "pending").neq("user_id", user.id).maybeSingle(),
    serviceClient.from("driver_applications").select("id").ilike("discord_username", values.discord_username).eq("status", "pending").neq("user_id", user.id).maybeSingle(),
    serviceClient.from("driver_applications").select("id").eq("steam_id", values.steam_id).eq("status", "pending").neq("user_id", user.id).maybeSingle(),
  ] as const;

  const [driverCar, driverDiscord, driverSteam, appCar, appDiscord, appSteam] = await Promise.all(duplicateChecks);
  const duplicateErrors: Record<string, string> = {};

  if (driverCar.data || appCar.data) duplicateErrors.car_number = "This car number is already taken or pending review.";
  if (driverDiscord.data || appDiscord.data) duplicateErrors.discord_username = "This Discord username is already used or pending review.";
  if (driverSteam.data || appSteam.data) duplicateErrors.steam_id = "This Steam ID is already used or pending review.";

  if (Object.keys(duplicateErrors).length > 0) {
    return { ok: false, message: "Some fields are already in use.", fieldErrors: duplicateErrors };
  }

  const payload = {
    ...values,
    user_id: user.id,
    status: "pending",
    rejection_note: null,
    updated_at: new Date().toISOString(),
  };

  const { data: existingApplication } = await serviceClient
    .from("driver_applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  const { error } = existingApplication
    ? await serviceClient.from("driver_applications").update(payload).eq("id", existingApplication.id)
    : await serviceClient.from("driver_applications").insert(payload);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/register");
  revalidatePath("/admin");

  return {
    ok: true,
    message: "Application submitted. Race control will review it before approval.",
  };
}
