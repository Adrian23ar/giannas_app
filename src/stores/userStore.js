import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import { useRouter } from 'vue-router'

export const useUserStore = defineStore('user', () => {
  const router = useRouter()
  const user = ref(undefined)
  const profile = ref(null)

  const isLoggedIn = computed(() => !!user.value)
  const userRole = computed(() => profile.value?.role || null)
  const userFullName = computed(() => user.value?.user_metadata?.full_name || '')
  const userPhone = computed(() => user.value?.user_metadata?.phone || '')
  const userEmail = computed(() => user.value?.email || '')

  const fetchUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user.value = authUser;
    if (authUser) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();
      profile.value = userProfile;
    } else {
      profile.value = null;
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
      user.value = null
      profile.value = null
      router.push('/')
    } else if (session) {
      user.value = session.user
      fetchUser()
    }
  })

  return { user, profile, isLoggedIn, userRole, userFullName, userPhone, userEmail, fetchUser, signOut }
})
