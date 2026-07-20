const express = require('express');
const router = express.Router();
const { requireAuth, supabase } = require('../middleware/auth');

// Get current Gemini configuration
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('gemini_config')
      .select('*')
      .eq('user_id', req.user.id);
      
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a specific task config
router.post('/', requireAuth, async (req, res) => {
  const { task_type, model_id, temperature, max_tokens } = req.body;
  if (!task_type || !model_id) return res.status(400).json({ error: 'task_type and model_id required' });

  try {
    // Check if it exists first because we don't have a unique constraint on (user_id, task_type), wait we don't.
    // Let's manually check and update or insert.
    const { data: existing } = await supabase
      .from('gemini_config')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('task_type', task_type)
      .single();

    let result;
    if (existing) {
      result = await supabase
        .from('gemini_config')
        .update({
          model_id,
          temperature: temperature || 0.7,
          max_tokens: max_tokens || 1500,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select();
    } else {
      result = await supabase
        .from('gemini_config')
        .insert({
          user_id: req.user.id,
          task_type,
          model_id,
          temperature: temperature || 0.7,
          max_tokens: max_tokens || 1500
        })
        .select();
    }

    if (result.error) throw result.error;
    res.json(result.data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
