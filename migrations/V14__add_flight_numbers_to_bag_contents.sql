-- Add custom flight numbers to bag_contents for user-specific disc characteristics
-- These override disc_master values when set, allowing tracking of wear-in and plastic variations

ALTER TABLE bag_contents 
ADD COLUMN speed INTEGER NULL,
ADD COLUMN glide INTEGER NULL,
ADD COLUMN turn INTEGER NULL,
ADD COLUMN fade INTEGER NULL;

-- Add constraints for valid flight number ranges
ALTER TABLE bag_contents ADD CONSTRAINT chk_speed_range CHECK (speed IS NULL OR (speed >= 1 AND speed <= 15));
ALTER TABLE bag_contents ADD CONSTRAINT chk_glide_range CHECK (glide IS NULL OR (glide >= 1 AND glide <= 7));
ALTER TABLE bag_contents ADD CONSTRAINT chk_turn_range CHECK (turn IS NULL OR (turn >= -5 AND turn <= 2));
ALTER TABLE bag_contents ADD CONSTRAINT chk_fade_range CHECK (fade IS NULL OR (fade >= 0 AND fade <= 5));

-- Create comment for documentation
COMMENT ON COLUMN bag_contents.speed IS 'User-specific speed override. NULL means use disc_master.speed';
COMMENT ON COLUMN bag_contents.glide IS 'User-specific glide override. NULL means use disc_master.glide';
COMMENT ON COLUMN bag_contents.turn IS 'User-specific turn override. NULL means use disc_master.turn';
COMMENT ON COLUMN bag_contents.fade IS 'User-specific fade override. NULL means use disc_master.fade';