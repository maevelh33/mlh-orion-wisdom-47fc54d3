import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Order, Product } from "@/lib/shop";

/** Valeurs affichées tant que la base n'est pas joignable (prix de lancement de Hybris). */
const FALLBACK_PRODUCTS: Record<string, Product> = {
  hybris: {
    id: "hybris",
    title: "Hybris",
    release_label: "Début 2027",
    release_date: null,
    ebook_status: "preorder",
    ebook_price_cents: 1500,
    paper_price_cents: 3399,
    shipping_fr_cents: null,
    shipping_eu_cents: null,
    ebook_file_path: null,
  },
};

export const useProducts = () =>
  useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      if (!supabase) return Object.values(FALLBACK_PRODUCTS);
      const { data, error } = await supabase.from("products").select("*").order("title");
      if (error) throw error;
      return data as Product[];
    },
  });

export const useProduct = (id: string) => {
  const query = useProducts();
  const product = query.data?.find((p) => p.id === id) ?? (query.isError ? FALLBACK_PRODUCTS[id] : undefined);
  return { ...query, product };
};

export const useMyOrders = (userId: string | undefined) =>
  useQuery({
    queryKey: ["orders", userId],
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<Order[]> => {
      // Filtre explicite : l'administratrice a le droit de lire toutes les commandes,
      // mais son espace personnel ne doit montrer que les siennes.
      const { data, error } = await supabase!.from("orders").select("*").eq("user_id", userId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

export interface Notification {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export const useNotifications = (userId: string | undefined) =>
  useQuery({
    queryKey: ["notifications", userId],
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase!
        .from("notifications")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Notification[];
    },
  });
