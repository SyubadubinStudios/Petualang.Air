using PetualangAir.Wpf.Services;
namespace PetualangAir.Tests;

public class GameStateTests : IDisposable
{
    private readonly string directory = Path.Combine(Path.GetTempPath(), "PetualangAirTests", Guid.NewGuid().ToString());
    private string SavePath => Path.Combine(directory, "save.json");

    [Fact]
    public void Upgrade_ChargesCorrectAmount_StopsAtMaximum()
    {
        var state = new GameStateService(SavePath);
        Assert.True(state.UpgradeRakit());
        Assert.Equal(50, state.KoinNusantara);
        Assert.False(state.UpgradeRakit());
        state.TambahKoin(1000);
        Assert.True(state.UpgradeRakit());
        Assert.True(state.UpgradeRakit());
        var balance = state.KoinNusantara;
        Assert.False(state.UpgradeRakit());
        Assert.Equal(4, state.LevelRakit);
        Assert.Equal(balance, state.KoinNusantara);
    }

    [Fact]
    public void Damage_ClampsHealth_RecoveryRestoresIt()
    {
        var state = new GameStateService(SavePath);
        state.KenaRintangan(-10);
        Assert.Equal(100, state.KetahananRakit);
        state.KenaRintangan(1000);
        Assert.Equal(0, state.KetahananRakit);
        state.PulihkanRakit();
        Assert.Equal(100, state.KetahananRakit);
        state.SetStamina(-5);
        Assert.Equal(0, state.StaminaJopi);
        state.SetStamina(200);
        Assert.Equal(100, state.StaminaJopi);
    }

    [Fact]
    public void Progress_RoundTripsAcrossSessions()
    {
        var state = new GameStateService(SavePath);
        state.UpgradeRakit();
        for (int i = 0; i < 6; i++) state.Collect(ResourceType.Coin);
        state.SetBioma(BiomaType.HutanGambut);
        state.KenaRintangan(20);
        var loaded = new GameStateService(SavePath);
        Assert.Equal(300, loaded.KoinNusantara);
        Assert.Equal(2, loaded.LevelRakit);
        Assert.Equal(80, loaded.KetahananRakit);
        Assert.Equal(BiomaType.HutanGambut, loaded.BiomaAktif);
        loaded.SetBioma((BiomaType)999);
        Assert.Equal(BiomaType.HutanGambut, loaded.BiomaAktif);
    }

    [Fact]
    public void CorruptSave_UsesDefaultsAndReportsFailure()
    {
        Directory.CreateDirectory(directory);
        File.WriteAllText(SavePath, "broken json");
        var state = new GameStateService(SavePath);
        Assert.Equal(150, state.KoinNusantara);
        Assert.Contains("gagal dimuat", state.StatusSimpan);
    }

    [Fact]
    public void InvalidSavedValues_AreClamped()
    {
        Directory.CreateDirectory(directory);
        File.WriteAllText(SavePath, """{"Koin":-50,"Level":99,"Ketahanan":-2,"Bioma":123}""");
        var state = new GameStateService(SavePath);
        Assert.Equal(0, state.KoinNusantara);
        Assert.Equal(4, state.LevelRakit);
        Assert.Equal(0, state.KetahananRakit);
        Assert.Equal(BiomaType.SungaiGunung, state.BiomaAktif);
    }

    public void Dispose()
    {
        if (Directory.Exists(directory)) Directory.Delete(directory, true);
    }
}
