-- Testimonies: staff RLS + seed approved stories for KDC Uganda

DROP POLICY IF EXISTS "Admins can manage all testimonies" ON public.testimonies;

CREATE POLICY "Staff can view all testimonies"
  ON public.testimonies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Staff can manage testimonies"
  ON public.testimonies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Staff can delete testimonies"
  ON public.testimonies
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- Seed sample approved testimonies (only when table is empty)
DO $$
BEGIN
  IF (SELECT COUNT(*)::int FROM public.testimonies) = 0 THEN
    INSERT INTO public.testimonies (
      name, email, phone, location, testimony, status, created_at
    ) VALUES
    (
      'Sarah K.',
      NULL,
      '+256 700 100 201',
      'Kampala, Uganda',
      'Ever since I joined Kingdom Deliverance Centre, my life has completely transformed. The teachings on faith and deliverance helped my business grow tremendously. I give God all the glory!',
      'approved',
      NOW() - INTERVAL '45 days'
    ),
    (
      'David M.',
      NULL,
      '+256 701 200 302',
      'Entebbe, Uganda',
      'I was struggling with an illness for years, but after Bishop Climate prayed for me during the Sunday service at KDC, I received my total healing. Glory to God!',
      'approved',
      NOW() - INTERVAL '38 days'
    ),
    (
      'Grace A.',
      'grace.a@example.com',
      '+256 702 300 403',
      'Kosovo–Lungujja, Kampala',
      'The Wednesday Bible study sessions at Kingdom Deliverance Centre have opened my eyes to the true power of the Word. My family has experienced so much peace and restoration.',
      'approved',
      NOW() - INTERVAL '30 days'
    ),
    (
      'John & Mary N.',
      NULL,
      '+256 703 400 504',
      'Wakiso, Uganda',
      'We were praying for a financial breakthrough, and God answered us miraculously through the ministry. We are now debt-free and thriving. Thank you, KDC Uganda!',
      'approved',
      NOW() - INTERVAL '22 days'
    ),
    (
      'Ruth T.',
      NULL,
      '+256 704 500 605',
      'Kampala, Uganda',
      'The Fire Service and deliverance teachings set me free from bondage I carried for over a decade. Today I worship with joy and serve in the ushers team.',
      'approved',
      NOW() - INTERVAL '14 days'
    ),
    (
      'Emmanuel O.',
      'emmanuel.o@example.com',
      '+256 705 600 706',
      'Mukono, Uganda',
      'Kingdom Deliverance Centre Uganda is a place where the presence of God is real. My marriage was restored and my children are walking in faith because of this church.',
      'approved',
      NOW() - INTERVAL '7 days'
    );
  END IF;
END $$;
