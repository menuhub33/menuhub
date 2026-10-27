export type Notification = {
  id: string;
  user_id: string;
  restaurant_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};
