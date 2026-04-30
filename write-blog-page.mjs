import fs from 'fs';
const outPath = 'src/app/(public)/blog/[slug]/page.tsx';
const content = [
  import { createClient } from "@/lib/supabase/server";,
  import { format } from "date-fns";,
  import Link from "next/link";,
  import Image from "next/image";,
  import { notFound } from "next/navigation";,
  import { Calendar, User, Clock, Eye, Tag, ChevronRight, Download, Globe, Mail } from "lucide-react";,
  import type { Metadata } from "next";,
  import { headers } from "next/headers";,
  import { incrementPostViews, autoPublishScheduled } from "@/lib/actions/posts";,
].join('\n');
fs.writeFileSync(outPath, content, 'utf8');
console.log('Written', content.length, 'chars');
