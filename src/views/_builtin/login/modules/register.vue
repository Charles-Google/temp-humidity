<script setup lang="ts">
import { computed, reactive } from 'vue';
import { $t } from '@/locales';
import { useRouterPush } from '@/hooks/common/router';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({
  name: 'Register'
});

const { toggleLoginModule } = useRouterPush();
const { formRef, validate } = useNaiveForm();

interface FormModel {
  account: string;
  password: string;
  confirmPassword: string;
  mail: string;
}

const model: FormModel = reactive({
  account: '',
  password: '',
  confirmPassword: '',
  mail: ''
});

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules, createConfirmPwdRule } = useFormRules();

  return {
    account: formRules.userName,
    password: formRules.pwd,
    confirmPassword: createConfirmPwdRule(model.password),
    mail: formRules.email
  };
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://useradminfc-cndlionphb.cn-hangzhou.fcapp.run';

async function handleSubmit() {
  await validate();
  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        account: model.account,
        password: model.password,
        mail: model.mail
      })
    });

    const data = await response.json();
    if (data.status === 1) {
      window.$message?.success($t('page.login.common.validateSuccess'));
      toggleLoginModule('pwd-login');
    } else {
      window.$message?.error(data.message || '注册失败');
    }
  } catch (error) {
    console.error('注册失败:', error);
    window.$message?.error('注册失败');
  }
}
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false" @keyup.enter="handleSubmit">
    <NFormItem path="account">
      <NInput v-model:value="model.account" :placeholder="$t('page.login.common.userNamePlaceholder')" />
    </NFormItem>
    <NFormItem path="mail">
      <NInput v-model:value="model.mail" placeholder="请输入邮箱" />
    </NFormItem>
    <NFormItem path="password">
      <NInput
        v-model:value="model.password"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.login.common.passwordPlaceholder')"
      />
    </NFormItem>
    <NFormItem path="confirmPassword">
      <NInput
        v-model:value="model.confirmPassword"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.login.common.confirmPasswordPlaceholder')"
      />
    </NFormItem>
   
    <NSpace vertical :size="18" class="w-full">
      <NButton type="primary" size="large" round block @click="handleSubmit">
        {{ $t('common.confirm') }}
      </NButton>
      <NButton size="large" round block @click="toggleLoginModule('pwd-login')">
        {{ $t('page.login.common.back') }}
      </NButton>
    </NSpace>
  </NForm>
</template>

<style scoped></style>
