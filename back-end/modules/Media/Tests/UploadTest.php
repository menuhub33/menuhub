<?php

namespace Modules\Media\Tests;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Modules\Media\Services\MediaStorage;
use Modules\Shared\Tests\ApiTestCase;

class UploadTest extends ApiTestCase
{
    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        config(['menuhub.media.disk' => 'public']);
    }

    private function image(string $name = 'a.png'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, base64_decode(self::PNG));
    }

    public function test_member_can_upload_an_image(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        Sanctum::actingAs($owner);

        $url = $this->post($this->api('uploads'), [
            'file' => $this->image(), 'folder' => 'products', 'restaurant_id' => $restaurant->id,
        ], ['Accept' => 'application/json'])->assertSuccessful()->json('data.url');

        $this->assertNotEmpty($url);
    }

    public function test_non_members_and_anonymous_users_cannot_upload(): void
    {
        [, $restaurant] = $this->makeRestaurant();

        $this->post($this->api('uploads'), [
            'file' => $this->image(), 'folder' => 'products', 'restaurant_id' => $restaurant->id,
        ], ['Accept' => 'application/json'])->assertUnauthorized();

        Sanctum::actingAs($this->makeUser());
        $this->post($this->api('uploads'), [
            'file' => $this->image(), 'folder' => 'products', 'restaurant_id' => $restaurant->id,
        ], ['Accept' => 'application/json'])->assertForbidden();
    }

    public function test_private_r2_endpoint_is_not_used_as_the_image_url(): void
    {
        config([
            'app.url' => 'http://localhost:8000',
            'menuhub.media.public_url' => 'https://account.r2.cloudflarestorage.com',
        ]);

        $key = 'categories/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222.png';

        $this->assertSame(
            'http://localhost:8000/api/v1/media/'.$key,
            app(MediaStorage::class)->url($key)
        );
    }

    public function test_stored_image_can_be_loaded_without_authentication(): void
    {
        $key = 'categories/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222.png';
        Storage::disk('public')->put($key, base64_decode(self::PNG));

        $this->get($this->api('media/'.$key))
            ->assertOk()
            ->assertHeader('content-type', 'image/png');
    }

    public function test_non_images_are_rejected(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        Sanctum::actingAs($owner);

        $this->post($this->api('uploads'), [
            'file' => UploadedFile::fake()->createWithContent('x.php', '<?php echo 1;'),
            'folder' => 'products', 'restaurant_id' => $restaurant->id,
        ], ['Accept' => 'application/json'])->assertStatus(422);
    }
}
